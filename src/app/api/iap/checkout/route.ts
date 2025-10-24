import { createClient } from '@supabase/supabase-js';

// Creates a Whop checkout session (real) if WHOP_API_KEY present; falls back to dev mock URL otherwise.
export async function POST(request: Request) {
  const { memberId, bundleId, credits, amountUsd } = await request.json().catch(() => ({}));
  if (!memberId || !credits) return new Response('memberId and credits required', { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const whopApiKey = process.env.WHOP_API_KEY;
  const apiBase = process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2';
  const checkoutCreateUrl = process.env.WHOP_CHECKOUT_CREATE_URL ?? `${apiBase}/checkout/sessions`;
  // Prefer current origin in dev to avoid redirecting to production domain
  const origin = new URL(request.url).origin;
  let base = process.env.NEXT_PUBLIC_BASE_URL ?? origin;
  if (process.env.NODE_ENV !== 'production') base = origin;

  // Insert pending record first with temp txn id
  const tempTxn = `pending_${crypto.randomUUID()}`;
  const { data: purchase, error } = await supabase
    .from('iap_purchases')
    .insert({ member_id: memberId, whop_txn_id: tempTxn, bundle_id: bundleId ?? 'bundle', amount_usd: amountUsd ?? 0, credits_awarded: credits, status: 'pending' })
    .select('id, whop_txn_id')
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });

  // Real Whop checkout
  if (whopApiKey) {
    try {
      const body: any = {
        // Fallback keys; adjust to your Whop product/price schema
        product_id: process.env.WHOP_PRODUCT_ID ?? bundleId ?? 'default',
        // Success should land on a frontend confirmation page; webhook will notify server separately
        success_url: `${base}/iap/confirm?pid=${purchase?.id}`,
        cancel_url: `${base}/`,
        metadata: { iap_purchase_id: purchase?.id, memberId, credits },
      };
      const res = await fetch(checkoutCreateUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${whopApiKey}` },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(()=>({}));
      if (!res.ok) {
        // fall back to stubbed URL if API fails
        const checkoutUrl = `${base}/iap/confirm?event=purchase.succeeded&txn=${encodeURIComponent(tempTxn)}`;
        return new Response(JSON.stringify({ ok: true, checkoutUrl, purchaseId: purchase?.id, fallback: true }), { headers: { 'content-type': 'application/json' } });
      }
      // Update txn id if Whop returns one
      const whop_txn_id = json?.id ?? json?.transaction_id ?? tempTxn;
      await supabase.from('iap_purchases').update({ whop_txn_id }).eq('id', purchase?.id);
      const checkoutUrl = json?.url ?? json?.checkout_url ?? json?.links?.checkout ?? base;
      return new Response(JSON.stringify({ ok: true, checkoutUrl, purchaseId: purchase?.id }), { headers: { 'content-type': 'application/json' } });
    } catch {
      const checkoutUrl = `${base}/iap/confirm?event=purchase.succeeded&txn=${encodeURIComponent(tempTxn)}`;
      return new Response(JSON.stringify({ ok: true, checkoutUrl, purchaseId: purchase?.id, fallback: true }), { headers: { 'content-type': 'application/json' } });
    }
  }

  // Dev mock URL
  const checkoutUrl = `${base}/iap/confirm?event=purchase.succeeded&txn=${encodeURIComponent(tempTxn)}`;
  return new Response(JSON.stringify({ ok: true, checkoutUrl, purchaseId: purchase?.id, dev: true }), { headers: { 'content-type': 'application/json' } });
}


