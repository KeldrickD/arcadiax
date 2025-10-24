import { getAccountSettings, upsertAccountSettings } from '@/lib/settings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  if (!accountId) return new Response('accountId required', { status: 400 });
  const s = await getAccountSettings(accountId);
  return new Response(JSON.stringify({ ok: true, settings: s }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const accountId = body.accountId as string | undefined;
  if (!accountId) return new Response('accountId required', { status: 400 });
  const partial = {
    allowRaffles: body.allowRaffles,
    allowPredictions: body.allowPredictions,
    quietStartHour: body.quietStartHour,
    quietEndHour: body.quietEndHour,
    pushDailyCap: body.pushDailyCap,
    feedDailyCap: body.feedDailyCap,
  };
  await upsertAccountSettings(accountId, partial);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}


