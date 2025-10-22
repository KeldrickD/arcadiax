import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!url || !anon) return new Response('Missing Supabase env', { status: 500 });
  if (!accountId) return new Response('accountId required', { status: 400 });

  const supabase = createClient(url, anon);
  const { data, error } = await supabase
    .from('game_sessions')
    .select('id, status, schedule_at, entry_cost, game:games(id, name, type)')
    .order('created_at', { ascending: false })
    .limit(50)
    .in('game_id',
      (await supabase.from('games').select('id').eq('account_id', accountId))
        .data?.map(g => g.id) ?? []
    );

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ items: data ?? [] }), {
    headers: { 'content-type': 'application/json' },
  });
}

