import { createClient } from '@supabase/supabase-js';

// DEV checkout stub: creates a pending purchase and returns a mock URL that triggers the webhook
export async function POST(request: Request) {
  const { memberId, bundleId, credits, amountUsd } = await request.json().catch(() => ({}));
  if (!memberId || !credits || !amountUsd) return new Response('memberId, credits, amountUsd required', { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const whop_txn_id = `mock_${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from('iap_purchases')
    .insert({ member_id: memberId, whop_txn_id, bundle_id: bundleId ?? 'mock', amount_usd: amountUsd, credits_awarded: credits, status: 'pending' })
    .select('id, whop_txn_id')
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const checkoutUrl = `${base}/api/iap/webhook?event=purchase.succeeded&txn=${encodeURIComponent(data?.whop_txn_id ?? whop_txn_id)}`;
  return new Response(JSON.stringify({ ok: true, checkoutUrl }), { headers: { 'content-type': 'application/json' } });
}


