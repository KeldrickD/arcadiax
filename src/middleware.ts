import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Dev bypass: skip auth entirely when enabled
  const bypass = process.env.WHOP_BYPASS_AUTH === 'true';
  const url = new URL(req.url);
  const path = url.pathname;

  // Only gate Experience and Dashboard paths
  const shouldGate = path.startsWith('/experience/') || path.startsWith('/dashboard/');
  if (!shouldGate) return NextResponse.next();

  if (bypass) {
    const res = NextResponse.next();
    // Ensure a dummy token exists so server components that read it keep working
    if (!req.cookies.get('whop_access_token')) {
      res.cookies.set('whop_access_token', 'dev-bypass', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    }
    return res;
  }

  const token = req.cookies.get('whop_access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/oauth', url));
  }

  // If company/account id is in the path, we can optionally pass-through; deeper validation is done server-side
  return NextResponse.next();
}

export const config = {
  matcher: ['/experience/:path*', '/dashboard/:path*'],
};


