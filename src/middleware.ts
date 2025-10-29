import { NextRequest, NextResponse } from 'next/server';
import { isBypass } from './lib/auth';

export async function middleware(req: NextRequest) {
  // Dev bypass: skip auth entirely when enabled
  const bypass = isBypass;
  const url = new URL(req.url);
  const path = url.pathname;

  const PUBLIC_PATHS = ['/api/iap/webhook', '/api/sentry/webhook', '/api/health', '/api/rls/verify', '/_next', '/favicon.ico', '/robots.txt'];
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) return NextResponse.next();

  // Whop App auth (no OAuth): capture token from query and set secure cookie
  const tokenParams = ['whop_token', 'access_token', 'token'];
  for (const p of tokenParams) {
    const v = url.searchParams.get(p);
    if (v) {
      url.searchParams.delete(p);
      const res = NextResponse.redirect(url.toString());
      res.cookies.set('whop_access_token', v, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 60 * 60,
      });
      return res;
    }
  }

  if (bypass) {
    const res = NextResponse.next();
    // Ensure a dummy token exists so server components that read it keep working
    if (!req.cookies.get('whop_access_token')) {
      res.cookies.set('whop_access_token', 'dev-bypass', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    }
    return res;
  }

  // If Authorization header is provided by Whop iframe, persist as cookie for SSR
  const authz = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authz && authz.toLowerCase().startsWith('bearer ')) {
    const bearer = authz.slice(7).trim();
    if (bearer && !req.cookies.get('whop_access_token')) {
      const res = NextResponse.next();
      res.cookies.set('whop_access_token', bearer, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 60 * 60,
      });
      return res;
    }
  }

  // If no token cookie yet, allow request to proceed; pages can render public state.

  // If company/account id is in the path, we can optionally pass-through; deeper validation is done server-side
  return NextResponse.next();
}

export const config = {
  matcher: ['/experience/:path*', '/dashboard/:path*'],
};


