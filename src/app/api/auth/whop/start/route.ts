export async function GET(request: Request) {
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const reqOrigin = new URL(request.url).origin;
  const baseUrl = (process.env.NODE_ENV !== 'production') ? reqOrigin : (process.env.NEXT_PUBLIC_BASE_URL ?? reqOrigin);
  const authorizeBaseRaw = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUTHORIZE_URL ?? 'https://whop.com/oauth/authorize';
  const authorizeBase = authorizeBaseRaw.replace(/\/+$/, '');
  const scope = process.env.NEXT_PUBLIC_WHOP_OAUTH_SCOPE ?? 'read_user read:memberships';
  const audience = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUDIENCE;
  if (!appId) {
    return new Response('Missing NEXT_PUBLIC_WHOP_APP_ID', { status: 500 });
  }

  const authorize = new URL(authorizeBase);
  authorize.searchParams.set('client_id', appId);
  authorize.searchParams.set('redirect_uri', `${baseUrl}/api/auth/whop/callback`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', Math.random().toString(36).slice(2));
  if (audience) authorize.searchParams.set('audience', audience);
  // some providers require explicit prompt
  authorize.searchParams.set('prompt', 'consent');

  return Response.redirect(authorize.toString(), 302);
}
