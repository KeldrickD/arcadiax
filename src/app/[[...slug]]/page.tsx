import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function CatchAll() {
  // Prefer creator dashboard if we can resolve their account from Whop token
  try {
    const c = await cookies();
    const access = c.get('whop_access_token')?.value;
    if (access) {
      const { fetchWhopMyMemberships } = await import('@/lib/whop');
      const memberships = await fetchWhopMyMemberships(access);
      const whopCompanyId = memberships?.[0]?.company_id ?? memberships?.[0]?.company?.id;
      if (whopCompanyId) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
        if (url && serviceKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
          const { data } = await supabase
            .from('accounts')
            .select('id')
            .eq('whop_company_id', whopCompanyId)
            .maybeSingle();
          const accountUuid = data?.id as string | undefined;
          if (accountUuid) return redirect(`/dashboard/${accountUuid}`);
        }
      }
    }
  } catch {}

  // Fallback to experience list for the first available account
  const demo = process.env.NEXT_PUBLIC_DEMO_EXPERIENCE_ID || process.env.DEMO_EXPERIENCE_ID;
  if (demo) return redirect(`/experience/${encodeURIComponent(demo)}`);
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (url && serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      const { data } = await supabase.from('accounts').select('id').limit(1);
      const first = data?.[0]?.id as string | undefined;
      if (first) return redirect(`/experience/${first}`);
    }
  } catch {}
  redirect('/experience');
}


