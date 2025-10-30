import { exchangeWhopCodeForToken, fetchWhopMe, fetchWhopMyMemberships } from '@/lib/whop';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const popupParam = searchParams.get('popup');
  const state = searchParams.get('state') || '';
  const popupFromState = state.endsWith('.p');
  const popup = popupParam || (popupFromState ? '1' : null);
  const reqOrigin = new URL(request.url).origin;
  const redirectUri = `${reqOrigin}/api/auth/whop/callback`;

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  try {
    const token = await exchangeWhopCodeForToken({ code, redirectUri });
    const isSecure = new URL(request.url).protocol === 'https:';
    // Decide where to send the user after login. Default to /experience
    let redirectPath: string = '/experience';
    // If popup mode, return a small HTML page that reloads/redirects the opener
    const res = popup ? new NextResponse(
      `<!doctype html><html><body><script>
        try { if (window.opener) { window.opener.location = '${redirectPath}'; } } catch(e){}
        window.close();
        setTimeout(function(){ location.href = '${redirectPath}'; }, 300);
      </script><p>Authentication complete. You can close this window.</p></body></html>`,
      { headers: { 'content-type': 'text/html' } }
    ) : NextResponse.redirect(new URL(redirectPath, request.url));
    res.cookies.set('whop_access_token', token.access_token, {
      httpOnly: true,
      // Required for cookies inside Whop iframe (cross-site):
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: token.expires_in ?? 60 * 60,
    });
    // Best-effort: map profile to members
    try {
      const me = await fetchWhopMe(token.access_token);
      const memberships = await fetchWhopMyMemberships(token.access_token);
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      if (url && serviceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const display = me?.name ?? me?.username ?? null;
        const avatar = me?.avatar_url ?? me?.image_url ?? null;
        let firstAccountUuid: string | undefined;
        for (const m of memberships ?? []) {
          const whopCompanyId = m?.company_id ?? m?.company?.id;
          if (!whopCompanyId) continue;
          let { data: acc } = await supabase
            .from('accounts')
            .select('id')
            .eq('whop_company_id', whopCompanyId)
            .maybeSingle();
          let accountUuid = acc?.id as string | undefined;
          if (!accountUuid) {
            const { data: created } = await supabase
              .from('accounts')
              .insert({ whop_company_id: whopCompanyId })
              .select('id')
              .maybeSingle();
            accountUuid = created?.id as string | undefined;
          }
          if (!accountUuid) continue;
          if (!firstAccountUuid) firstAccountUuid = accountUuid;
          const userId = me?.id ?? me?.user_id ?? 'whop';
          const { data: mem } = await supabase
            .from('members')
            .select('id')
            .eq('account_id', accountUuid)
            .eq('whop_user_id', userId)
            .maybeSingle();
          if (!mem) {
            await supabase.from('members').insert({ account_id: accountUuid, whop_user_id: userId, display_name: display, avatar_url: avatar, role: 'member', balance_credits: 0 });
          } else {
            await supabase.from('members').update({ display_name: display, avatar_url: avatar }).eq('id', mem.id);
          }
        }
        if (!popup && firstAccountUuid) {
          redirectPath = `/experience/${firstAccountUuid}`;
          res.headers.set('Location', new URL(redirectPath, request.url).toString());
        } else if (popup && firstAccountUuid) {
          redirectPath = `/experience/${firstAccountUuid}`;
        }
      }
    } catch {}
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'OAuth failed';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
