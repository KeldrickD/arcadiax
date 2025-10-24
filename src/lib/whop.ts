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

// Feed and push stubs (call Whop when OAuth is finalized). Safe no-ops when API key missing.
export async function postToFeed(params: { companyId: string; title: string; body?: string; imageUrl?: string }): Promise<void> {
  const apiKey = process.env.WHOP_API_KEY;
  const apiBase = process.env.WHOP_API_BASE_URL ?? 'https://api.whop.com/v2';
  if (!apiKey) return; // no-op in dev
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
  try {
    await fetch(`${apiBase}/companies/${params.companyId}/notifications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ title: params.title, body: params.body }),
    });
  } catch {}
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
