export async function GET() {
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const authorizeBaseRaw = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUTHORIZE_URL ?? 'https://whop.com/oauth/authorize';
  const authorizeBase = authorizeBaseRaw.replace(/\/+$/, '');
  const scope = process.env.NEXT_PUBLIC_WHOP_OAUTH_SCOPE ?? 'read_user read:memberships';
  const audience = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUDIENCE;

  const authorize = new URL(authorizeBase);
  if (appId) authorize.searchParams.set('client_id', appId);
  authorize.searchParams.set('redirect_uri', `${baseUrl}/api/auth/whop/callback`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', scope);
  if (audience) authorize.searchParams.set('audience', audience);

  return new Response(
    JSON.stringify({
      url: authorize.toString(),
      env: {
        NEXT_PUBLIC_WHOP_APP_ID: !!appId,
        NEXT_PUBLIC_BASE_URL: baseUrl,
        NEXT_PUBLIC_WHOP_OAUTH_AUTHORIZE_URL: authorizeBase,
        scope,
        audience: audience ?? null,
      },
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}



