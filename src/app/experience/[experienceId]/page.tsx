import { headers, cookies } from 'next/headers';
import { isMember } from '@/lib/whop';
import { createClient } from '@supabase/supabase-js';
import { SessionPresenceList } from '@/components/SessionPresenceList';
import { RecentWinners } from '@/components/RecentWinners';

export default async function ExperiencePage({ params }: { params: Promise<{ experienceId: string }> }) {
  const { experienceId } = await params;
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const base = host ? `${proto}://${host}` : '';
  const c = cookies();
  const access = c.get('whop_access_token')?.value ?? '';
  const devBypass = process.env.WHOP_BYPASS_AUTH === 'true';

  // Resolve Whop company id from our account UUID
  let companyId = experienceId;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const key = serviceKey || anon;
    if (url && key) {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await supabase
        .from('accounts')
        .select('whop_company_id')
        .eq('id', experienceId)
        .limit(1)
        .maybeSingle();
      if (data?.whop_company_id) companyId = data.whop_company_id as string;
    }
  } catch {}

  let allowed = devBypass;
  if (!allowed) {
    if (!access) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Experience</h2>
          <p>Sign in via Whop to continue.</p>
        </div>
      );
    }
    const check = await isMember(access, companyId).catch(() => ({ ok: false, isMember: false }));
    if (!check.ok || !check.isMember) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Experience</h2>
          <p>Membership required for this community.</p>
        </div>
      );
    }
  }
  const res = await fetch(`${base}/api/sessions?accountId=${experienceId}`, { cache: 'no-store' });
  const json = await res.json();
  return (
    <div style={{ padding: 24 }}>
      <h2>Experience</h2>
      <p>experienceId: {experienceId}</p>
      {devBypass && (
        <p style={{ color: '#00E0FF' }}>Dev bypass active — membership check skipped.</p>
      )}
      <h3>Sessions</h3>
      <SessionPresenceList experienceId={experienceId} sessions={(json.items ?? [])} />
      <RecentWinners accountId={experienceId} />
      <div style={{ marginTop: 12 }}>
        <a href={`/experience/${experienceId}/wallet`} style={{ color: '#7C3AED' }}>Open Wallet</a>
      </div>
    </div>
  );
}
