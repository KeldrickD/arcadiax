import { exchangeWhopCodeForToken } from '@/lib/whop';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/auth/whop/callback`;

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  try {
    const token = await exchangeWhopCodeForToken({ code, redirectUri });
    const c = cookies();
    c.set('whop_access_token', token.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: token.expires_in ?? 60 * 60,
    });
    // Redirect to home after login
    return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/`, 302);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'OAuth failed';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
