import { createClient } from '@supabase/supabase-js';
import { withSentry, logRequest } from '../../../../sentry.server.config';
import { rateLimitKey } from '../../../../lib/rateLimit';

export async function GET(request: Request) {
  // Allow GET for dev trigger
  return await POST(request);
}

export const POST = withSentry(async (request: Request) => {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || request.headers.get('x-real-ip') || null;
  if (!rateLimitKey(String(ip), '/api/iap/webhook', 60, 60)) return new Response('rate limited', { status: 429 });
  const reqId = logRequest('/api/iap/webhook');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { searchParams } = new URL(request.url);
  let rawBody: string | null = null;
  try { rawBody = await request.text(); } catch { rawBody = null; }
  const maybeJson = (() => { try { return rawBody ? JSON.parse(rawBody) : {}; } catch { return {}; } })();
  const event = searchParams.get('event') ?? maybeJson.event;
  const txn = searchParams.get('txn') ?? maybeJson.txn ?? maybeJson.transaction_id ?? maybeJson.id;
  const eventId = request.headers.get('whop-event-id') || request.headers.get('x-whop-event-id') || maybeJson?.event_id || `${event}:${txn}`;
  if (!event || !txn) return new Response('event and txn required', { status: 400 });

  // Webhook idempotency
  try {
    const { data: existing } = await supabase.from('webhook_events').select('event_id').eq('event_id', eventId).maybeSingle();
    if (existing) return new Response(JSON.stringify({ ok: true, idempotent: true }), { headers: { 'content-type': 'application/json' } });
  } catch {}

  // Signature verification (best effort)
  const sigHeader = request.headers.get('whop-signature') || request.headers.get('x-whop-signature');
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (secret && rawBody && sigHeader) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const dict: Record<string,string> = {};
    for (const part of sigHeader.split(',')) { const [k,v] = part.split('='); if (k && v) dict[k]=v; }
    const t = dict['t'] ?? '';
    const v1 = dict['v1'] ?? '';
    const ok = await crypto.subtle.verify('HMAC', key, hexToBytes(v1), enc.encode(`${t}.${rawBody}`));
    if (!ok) return new Response('invalid signature', { status: 400 });
  }

  if (event === 'purchase.succeeded') {
    const { data: purchase, error } = await supabase
      .from('iap_purchases')
      .select('id, member_id, credits_awarded, status')
      .eq('whop_txn_id', txn)
      .maybeSingle();
    if (error) return new Response(error.message, { status: 500 });
    if (!purchase) return new Response('purchase not found', { status: 404 });
    if (purchase.status === 'succeeded') return new Response(JSON.stringify({ ok: true, idempotent: true }), { headers: { 'content-type': 'application/json' } });

    // Mark succeeded
    await supabase.from('iap_purchases').update({ status: 'succeeded' }).eq('id', purchase.id);

    // Credit wallet and ledger
    const { data: cur } = await supabase.from('members').select('balance_credits').eq('id', purchase.member_id).maybeSingle();
    const newBal = (cur?.balance_credits ?? 0) + (purchase.credits_awarded ?? 0);
    await supabase.from('members').update({ balance_credits: newBal }).eq('id', purchase.member_id);
    await supabase
      .from('credit_ledger')
      .upsert({ member_id: purchase.member_id, type: 'purchase', amount: purchase.credits_awarded, reference_type: 'iap', reference_id: purchase.id, notes: 'whop purchase', idempotency_key: `purchase:${eventId}:${txn}` }, { onConflict: 'idempotency_key' });

    try { await supabase.from('webhook_events').insert({ event_id: eventId }); } catch {}

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  if (event === 'refund_created' || event === 'refund_updated') {
    const amount = Number(maybeJson?.amount ?? 0);
    const purchaseId = maybeJson?.metadata?.iap_purchase_id ?? null;
    const { data: purchase } = await supabase.from('iap_purchases').select('id, member_id').eq('id', purchaseId).maybeSingle();
    if (purchase && amount > 0) {
      const { data: cur } = await supabase.from('members').select('balance_credits').eq('id', purchase.member_id).maybeSingle();
      const newBal = Math.max(0, (cur?.balance_credits ?? 0) - amount);
      await supabase.from('members').update({ balance_credits: newBal }).eq('id', purchase.member_id);
      await supabase.from('credit_ledger').insert({ member_id: purchase.member_id, type: 'refund', amount: -amount, reference_type: 'iap', reference_id: purchaseId, notes: 'refund' });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  if (event === 'dispute_created' || event === 'dispute_alert_created' || event === 'dispute_updated') {
    const amount = Number(maybeJson?.amount ?? 0);
    const purchaseId = maybeJson?.metadata?.iap_purchase_id ?? null;
    const { data: purchase } = await supabase.from('iap_purchases').select('id, member_id').eq('id', purchaseId).maybeSingle();
    if (purchase && amount > 0) {
      await supabase.from('credit_ledger').insert({ member_id: purchase.member_id, type: 'refund', amount: -amount, reference_type: 'iap', reference_id: purchaseId, notes: 'chargeback (soft lock record)' });
      // optional: implement soft-lock balance via separate table/column
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}, '/api/iap/webhook');

function hexToBytes(hex: string): ArrayBuffer {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out.buffer;
}


