export async function GET() {
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const authorizeBase = process.env.NEXT_PUBLIC_WHOP_OAUTH_AUTHORIZE_URL ?? 'https://whop.com/oauth/authorize';
  const scope = process.env.NEXT_PUBLIC_WHOP_OAUTH_SCOPE ?? 'read:memberships';
  if (!appId) {
    return new Response('Missing NEXT_PUBLIC_WHOP_APP_ID', { status: 500 });
  }

  const authorize = new URL(authorizeBase);
  authorize.searchParams.set('client_id', appId);
  authorize.searchParams.set('redirect_uri', `${baseUrl}/api/auth/whop/callback`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', scope);

  return Response.redirect(authorize.toString(), 302);
}
