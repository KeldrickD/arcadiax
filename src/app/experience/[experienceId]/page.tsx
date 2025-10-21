import { headers, cookies } from 'next/headers';
import { isMember } from '@/lib/whop';
import { createClient } from '@supabase/supabase-js';

export default async function ExperiencePage({ params }: { params: Promise<{ experienceId: string }> }) {
  const { experienceId } = await params;
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const base = host ? `${proto}://${host}` : '';
  const c = cookies();
  const access = c.get('whop_access_token')?.value ?? '';

  // Gate by membership; if not ok/member, show minimal message
  if (!access) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Experience</h2>
        <p>Sign in via Whop to continue.</p>
      </div>
    );
  }

  // Resolve Whop company id from our account UUID
  let companyId = experienceId;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      const supabase = createClient(url, anon);
      const { data } = await supabase
        .from('accounts')
        .select('whop_company_id')
        .eq('id', experienceId)
        .limit(1)
        .maybeSingle();
      if (data?.whop_company_id) companyId = data.whop_company_id as string;
    }
  } catch {}

  const check = await isMember(access, companyId).catch(() => ({ ok: false, isMember: false }));
  if (!check.ok || !check.isMember) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Experience</h2>
        <p>Membership required for this community.</p>
      </div>
    );
  }
  const res = await fetch(`${base}/api/sessions?accountId=${experienceId}`, { cache: 'no-store' });
  const json = await res.json();
  return (
    <div style={{ padding: 24 }}>
      <h2>Experience</h2>
      <p>experienceId: {experienceId}</p>
      <h3>Sessions</h3>
      <ul>
        {(json.items ?? []).map((s: any) => (
          <li key={s.id}>
            <a href={`/experience/${experienceId}/session/${s.id}`}>{s.game?.name ?? 'Session'} — {s.status}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
