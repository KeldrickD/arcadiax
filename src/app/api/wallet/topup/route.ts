import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { memberId, credits, usd } = await request.json().catch(() => ({}));
  if (!memberId || !Number.isFinite(credits)) return new Response('memberId and credits required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Increase balance
  const { data: after, error: updErr } = await supabase
    .from('members')
    .update({ balance_credits: (supabase as any) && undefined }) // placeholder
    .eq('id', memberId)
    .select('balance_credits')
    .maybeSingle();
  // Because we cannot atomically add with SQL here, do it via RPC-like pattern
  if (updErr || !after) {
    const { data: cur } = await supabase.from('members').select('balance_credits').eq('id', memberId).maybeSingle();
    const newBal = (cur?.balance_credits ?? 0) + credits;
    const { error: setErr } = await supabase.from('members').update({ balance_credits: newBal }).eq('id', memberId);
    if (setErr) return new Response(setErr.message, { status: 500 });
  }

  // Ledger purchase
  await supabase
    .from('credit_ledger')
    .insert({ member_id: memberId, type: 'purchase', amount: credits, reference_type: 'iap', reference_id: null, notes: usd ? `topup $${usd}` : 'topup' });

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}



