import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return new Response('sessionId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, anon);

  // Aggregate score per member in this session
  const { data, error } = await supabase
    .from('actions')
    .select('member_id, score')
    .in('round_id', (await supabase.from('game_rounds').select('id').eq('session_id', sessionId)).data?.map(r => r.id) ?? [])
    .not('score', 'is', null);

  if (error) return new Response(error.message, { status: 500 });

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.member_id as string, (totals.get(row.member_id as string) ?? 0) + (row.score as number));
  }
  const items = Array.from(totals.entries())
    .map(([memberId, total]) => ({ memberId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } });
}



