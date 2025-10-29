export type WhopTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
};

export async function exchangeWhopCodeForToken(params: {
  code: string;
  redirectUri: string;
}): Promise<WhopTokenResponse> {
  const apiKey = process.env.WHOP_API_KEY;
  if (!apiKey) throw new Error('Missing WHOP_API_KEY');

  const tokenUrl = process.env.WHOP_OAUTH_TOKEN_URL ?? 'https://whop.com/oauth/token';
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`Whop token exchange failed: ${res.status}`);
  }
  return (await res.json()) as WhopTokenResponse;
}

export async function fetchWhopMembership(opts: {
  accessToken: string;
  companyId: string;
}): Promise<Response> {
  const apiBase = process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2';
  return fetch(`${apiBase}/companies/${opts.companyId}/memberships/me`, {
    headers: { authorization: `Bearer ${opts.accessToken}` },
    cache: 'no-store',
  });
}

export type MembershipCheck = { ok: boolean; isMember: boolean };

export async function isMember(accessToken: string, companyId: string): Promise<MembershipCheck> {
  try {
    const res = await fetchWhopMembership({ accessToken, companyId });
    if (!res.ok) return { ok: false, isMember: false };
    const json = await res.json();
    const active = Boolean(json?.status === 'active' || json?.membership?.status === 'active');
    return { ok: true, isMember: active };
  } catch {
    return { ok: false, isMember: false };
  }
}

export type WhopRole = 'owner' | 'mod' | 'member' | 'unknown';

export async function getWhopRole(accessToken: string, companyId: string): Promise<WhopRole> {
  try {
    const res = await fetchWhopMembership({ accessToken, companyId });
    if (!res.ok) return 'unknown';
    const j = await res.json();
    const role = (j?.role ?? j?.membership?.role ?? j?.membership?.permissions?.role ?? '').toString().toLowerCase();
    if (role.includes('owner') || role === 'admin') return 'owner';
    if (role.includes('mod') || role.includes('manager') || role.includes('staff')) return 'mod';
    if (role.includes('member') || role === 'user') return 'member';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Feed and push stubs (call Whop when OAuth is finalized). Safe no-ops when API key missing.
export async function postToFeed(params: { companyId: string; title: string; body?: string; imageUrl?: string }): Promise<void> {
  const apiKey = process.env.WHOP_API_KEY;
  const apiBase = process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2';
  if (!apiKey) return; // no-op in dev
  // Quiet hours + caps (per-account overrides)
  const { getAccountSettings } = await import('./settings');
  const s = await getAccountSettings(params.companyId);
  const quietStart = s.quietStartHour; // 22 = 10pm
  const quietEnd = s.quietEndHour; // 8 = 8am
  const feedCap = s.feedDailyCap;
  try {
    await enforceQuietAndCaps({ accountId: params.companyId, kind: 'feed', cap: feedCap, quietStartHour: quietStart, quietEndHour: quietEnd });
  } catch { return; }
  try {
    await fetch(`${apiBase}/companies/${params.companyId}/feed/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ title: params.title, body: params.body, image_url: params.imageUrl }),
    });
  } catch {}
}

export async function sendPush(params: { companyId: string; title: string; body?: string }): Promise<void> {
  const apiKey = process.env.WHOP_API_KEY;
  const apiBase = process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2';
  if (!apiKey) return; // no-op in dev
  // Quiet hours + caps (per-account overrides)
  const { getAccountSettings } = await import('./settings');
  const s = await getAccountSettings(params.companyId);
  const quietStart = s.quietStartHour;
  const quietEnd = s.quietEndHour;
  const pushCap = s.pushDailyCap;
  try {
    await enforceQuietAndCaps({ accountId: params.companyId, kind: 'push', cap: pushCap, quietStartHour: quietStart, quietEndHour: quietEnd });
  } catch { return; }
  try {
    await fetch(`${apiBase}/companies/${params.companyId}/notifications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ title: params.title, body: params.body }),
    });
  } catch {}
}

async function enforceQuietAndCaps(opts: { accountId: string; kind: 'push'|'feed'; cap: number; quietStartHour: number; quietEndHour: number }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return;
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const now = new Date();
  const hour = now.getHours();
  const start = opts.quietStartHour % 24;
  const end = opts.quietEndHour % 24;
  const inQuiet = start < end ? (hour >= start && hour < end) : (hour >= start || hour < end);
  if (inQuiet) throw new Error('QUIET_HOURS');
  const day = now.toISOString().slice(0,10);
  const { data } = await supabase
    .from('notify_counters')
    .upsert({ account_id: opts.accountId, kind: opts.kind, day, count: 0 }, { onConflict: 'account_id,kind,day' })
    .select('id, count')
    .maybeSingle();
  const current = (data?.count ?? 0) as number;
  if (current >= opts.cap) throw new Error('DAILY_CAP');
  await supabase.from('notify_counters').update({ count: current + 1 }).eq('id', data?.id);
}

// User profile and memberships (best-effort; endpoint paths may vary by Whop API version)
export async function fetchWhopMe(accessToken: string): Promise<any | null> {
  const bases = [process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2', 'https://api.whop.com'];
  for (const base of bases) {
    try {
      const r = await fetch(`${base}/me`, { headers: { authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch {}
    try {
      const r = await fetch(`${base}/users/me`, { headers: { authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch {}
  }
  return null;
}

export async function fetchWhopMyMemberships(accessToken: string): Promise<any[]> {
  const base = process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2';
  const paths = ['/me/memberships', '/memberships'];
  for (const p of paths) {
    try {
      const r = await fetch(`${base}${p}`, { headers: { authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      if (r.ok) { const j = await r.json(); return Array.isArray(j) ? j : (j.data ?? []); }
    } catch {}
  }
  return [];
}
