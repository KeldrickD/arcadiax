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
