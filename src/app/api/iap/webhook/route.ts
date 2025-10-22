import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Allow GET for dev trigger
  return await POST(request);
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { searchParams } = new URL(request.url);
  const event = searchParams.get('event') ?? (await request.json().catch(()=>({}))).event;
  const txn = searchParams.get('txn') ?? (await request.json().catch(()=>({}))).txn;
  if (!event || !txn) return new Response('event and txn required', { status: 400 });

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
      .insert({ member_id: purchase.member_id, type: 'purchase', amount: purchase.credits_awarded, reference_type: 'iap', reference_id: purchase.id, notes: 'whop purchase' });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}


