import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { sessionId, type, durationSec, startsAt, question, options, answer, prompt, winners } = await request.json().catch(()=>({}));
  if (!sessionId || !type || !durationSec || !startsAt) return new Response('Missing fields', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  let payload: any = { type, durationSec };
  let ans: any = {};
  if (type === 'trivia') { payload.question = question; payload.options = options; ans = { answerId: answer?.answerId ?? null }; }
  if (type === 'prediction') { payload.prompt = prompt; }
  if (type === 'raffle') { payload.prompt = prompt; payload.winners = winners ?? 1; }

  const { data, error } = await supabase
    .from('rounds_queue')
    .insert({ session_id: sessionId, type, payload, answer: ans, starts_at: new Date(startsAt).toISOString(), duration_sec: durationSec, status: 'pending' })
    .select('id')
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true, id: data?.id }), { headers: { 'content-type': 'application/json' } });
}


