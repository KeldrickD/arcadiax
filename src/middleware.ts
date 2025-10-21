import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Only gate Experience and Dashboard paths
  const shouldGate = path.startsWith('/experience/') || path.startsWith('/dashboard/');
  if (!shouldGate) return NextResponse.next();

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


