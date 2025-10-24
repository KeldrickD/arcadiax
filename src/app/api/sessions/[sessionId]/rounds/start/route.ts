import { createClient } from '@supabase/supabase-js';
import { withSentry, logRequest } from '../../../../../sentry.server.config';
import { postToFeed, sendPush } from '@/lib/whop';
import { getAccountSettings } from '@/lib/settings';

// Starts a new round. Body varies by type:
// - trivia:     { type:'trivia', question, options:[{id,label}], answerId, durationSec? }
// - prediction: { type:'prediction', prompt, durationSec?, answerTemplate?: any }
// - raffle:     { type:'raffle', prompt?, winners?: number, durationSec? }
export const POST = withSentry(async (request: Request, { params }: { params: Promise<{ sessionId: string }> }) => {
  const t0 = Date.now();
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({}));
  const type = body.type ?? 'trivia';
  let payload: any = null;
  let answer: any = null;
  let durationSec: number | undefined = body.durationSec;

  // resolve account settings for gating
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: sessRow } = await supabase.from('game_sessions').select('game_id').eq('id', sessionId).maybeSingle();
  const { data: gameRow } = await supabase.from('games').select('account_id').eq('id', (sessRow as any)?.game_id).maybeSingle();
  const accountId = (gameRow as any)?.account_id as string | undefined;
  const settings = accountId ? await getAccountSettings(accountId) : undefined;
  const allowRaffles = settings?.allowRaffles ?? (process.env.ALLOW_RAFFLES ?? 'true') === 'true';
  const allowPredictions = settings?.allowPredictions ?? (process.env.ALLOW_PREDICTIONS ?? 'true') === 'true';

  if (type === 'trivia') {
    const { question, options, answerId } = body;
    if (!question || !Array.isArray(options) || !answerId) return new Response('Invalid trivia body', { status: 400 });
    payload = { type: 'trivia', question, options, durationSec: durationSec ?? 20 };
    answer = { answerId };
  } else if (type === 'prediction') {
    if (!allowPredictions) return new Response('Predictions disabled in this region', { status: 403 });
    const { prompt } = body;
    if (!prompt) return new Response('Invalid prediction body', { status: 400 });
    payload = { type: 'prediction', prompt, durationSec: durationSec ?? 30 };
    // answer to be set later as outcome in close
    answer = body.answerTemplate ?? {};
  } else if (type === 'raffle') {
    if (!allowRaffles) return new Response('Raffles disabled in this region', { status: 403 });
    const { prompt, winners } = body;
    payload = { type: 'raffle', prompt: prompt ?? 'Raffle', winners: winners ?? 1, durationSec: durationSec ?? 20 };
    answer = {};
  } else {
    return new Response('Unsupported type', { status: 400 });
  }

  // supabase already created above

  // Close any existing active round
  await supabase
    .from('game_rounds')
    .update({ state: 'closed', ended_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('state', 'active');

  // Determine next index
  const { data: prev } = await supabase
    .from('game_rounds')
    .select('index')
    .eq('session_id', sessionId)
    .order('index', { ascending: false })
    .limit(1);
  const nextIndex = (prev?.[0]?.index ?? 0) + 1;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('game_rounds')
    .insert({ session_id: sessionId, index: nextIndex, state: 'active', payload, answer, started_at: now })
    .select('id, index, state, payload, answer')
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });

  // Mark session live
  await supabase.from('game_sessions').update({ status: 'live' }).eq('id', sessionId);
  
  // Announce via synthetic action for realtime/feed stub
  try {
    await supabase
      .from('actions')
      .insert({ round_id: data?.id, member_id: null as any, payload: { system: 'announce', event: 'round_started', type }, result: 'system' });
  } catch {}

  // Feed/Push if creds present
  try {
    const { data: sess } = await supabase
      .from('game_sessions')
      .select('game_id')
      .eq('id', sessionId)
      .maybeSingle();
    const { data: game } = await supabase
      .from('games')
      .select('account_id, name')
      .eq('id', sess?.game_id)
      .maybeSingle();
    if (game?.account_id) {
      await postToFeed({ companyId: game.account_id, title: `Round started: ${type}`, body: (type==='trivia' ? body.question : body.prompt) ?? '' });
      await sendPush({ companyId: game.account_id, title: 'Round started', body: (type==='trivia' ? body.question : body.prompt) ?? '' });
    }
  } catch {}

  const res = new Response(JSON.stringify({ ok: true, round: data, type }), { headers: { 'content-type': 'application/json' } });
  logRequest('/api/sessions/[id]/rounds/start', { session_id: sessionId, duration_ms: Date.now() - t0 });
  return res;
}, '/api/sessions/[id]/rounds/start');


