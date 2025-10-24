import { createClient } from '@supabase/supabase-js';

// Enqueue a best-of-N trivia schedule: sequential rounds spaced by gapSec
export async function POST(request: Request) {
  const { sessionId, count, gapSec, questionTemplate } = await request.json().catch(()=>({}));
  if (!sessionId || !count) return new Response('sessionId and count required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const now = Date.now();
  const rows = [] as any[];
  for (let i=0;i<count;i++) {
    const starts = new Date(now + i * (gapSec ?? 30) * 1000).toISOString();
    const q = questionTemplate ?? { question: `Q${i+1}: 2+2?`, options: [{id:'a',label:'3'},{id:'b',label:'4'}], answer:{answerId:'b'}, durationSec: 15 };
    rows.push({ session_id: sessionId, type: 'trivia', payload: { type:'trivia', question: q.question, options: q.options, durationSec: q.durationSec ?? 15 }, answer: q.answer ?? { answerId:'b' }, starts_at: starts, duration_sec: q.durationSec ?? 15, status: 'pending' });
  }
  const { error } = await supabase.from('rounds_queue').insert(rows);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true, queued: rows.length }), { headers: { 'content-type': 'application/json' } });
}


