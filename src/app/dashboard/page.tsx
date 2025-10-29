import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

export default async function DashboardRoot() {
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
          const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
          const { data } = await supabase
            .from('accounts')
            .select('id')
            .eq('whop_company_id', whopCompanyId)
            .maybeSingle();
          const accountUuid = data?.id as string | undefined;
          if (accountUuid) return redirect(`/dashboard/${accountUuid}/sessions`);
        }
      }
    }
  } catch {}

  const demo = process.env.NEXT_PUBLIC_DEMO_EXPERIENCE_ID || process.env.DEMO_EXPERIENCE_ID;
  if (demo) return redirect(`/dashboard/${encodeURIComponent(demo)}/sessions`);
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (url && serviceKey) {
      const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      const { data } = await supabase.from('accounts').select('id').limit(1);
      const first = data?.[0]?.id as string | undefined;
      if (first) return redirect(`/dashboard/${first}/sessions`);
    }
  } catch {}
  redirect('/experience');
}

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <main className="min-h-screen" style={{ padding: '40px 24px' }}>
      <h1 className="text-3xl font-bold">ArcadiaX — Dashboard</h1>
      <p className="mt-2 opacity-80" style={{ marginTop: 8, opacity: 0.8 }}>
        Creator tools load after auth.
      </p>
    </main>
  );
}


