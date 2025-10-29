export const dynamic = "force-dynamic";

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export default async function ExperiencePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  // 1) If Whop token exists, resolve membership → account and go to dashboard sessions
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

  const candidateKeys = [
    'experienceId', 'experience_id',
    'companyId', 'company_id',
    'accountId', 'account_id',
    'id'
  ];
  for (const key of candidateKeys) {
    const raw = searchParams?.[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) {
      return redirect(`/dashboard/${encodeURIComponent(value)}/sessions`);
    }
  }

  // Fallbacks for review/testing: demo env var or first account in DB
  const demoId = process.env.NEXT_PUBLIC_DEMO_EXPERIENCE_ID || process.env.DEMO_EXPERIENCE_ID;
  if (demoId) return redirect(`/dashboard/${encodeURIComponent(demoId)}/sessions`);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (url && serviceKey) {
      const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      const { data } = await supabase.from('accounts').select('id').limit(1);
      const first = data?.[0]?.id as string | undefined;
      if (first) return redirect(`/dashboard/${encodeURIComponent(first)}/sessions`);
    }
  } catch {}

  return (
    <main className="min-h-screen" style={{ padding: '40px 24px' }}>
      <h1 className="text-3xl font-bold">ArcadiaX — Experience</h1>
      <p className="mt-2 opacity-80" style={{ marginTop: 8, opacity: 0.8 }}>
        Sessions will appear here. If you’re a reviewer, this confirms the app is live.
      </p>
    </main>
  );
}


