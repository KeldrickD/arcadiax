export async function GET(request: Request) {
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const urlObj = new URL(request.url);
  const reqOrigin = urlObj.origin;
  const popup = urlObj.searchParams.get('popup');
  // Prefer explicit BASE_URL when provided, otherwise use request origin to avoid misconfig
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? reqOrigin;
  const authorizeBaseRaw = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUTHORIZE_URL ?? 'https://whop.com/oauth/authorize';
  const authorizeBase = authorizeBaseRaw.replace(/\/+$/, '');
  const scope = process.env.NEXT_PUBLIC_WHOP_OAUTH_SCOPE ?? 'read_user read:memberships';
  const audience = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUDIENCE;
  if (!appId) {
    return new Response('Missing NEXT_PUBLIC_WHOP_APP_ID', { status: 500 });
  }

  const authorize = new URL(authorizeBase);
  authorize.searchParams.set('client_id', appId);
  const cb = new URL(`${baseUrl}/api/auth/whop/callback`);
  authorize.searchParams.set('redirect_uri', cb.toString());
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', scope);
  // Encode popup intent in state to keep redirect_uri EXACTLY matching Whop settings
  const state = `${Math.random().toString(36).slice(2)}.${popup ? 'p' : 'n'}`;
  authorize.searchParams.set('state', state);
  if (audience) authorize.searchParams.set('audience', audience);
  // some providers require explicit prompt
  authorize.searchParams.set('prompt', 'consent');

  return Response.redirect(authorize.toString(), 302);
}
