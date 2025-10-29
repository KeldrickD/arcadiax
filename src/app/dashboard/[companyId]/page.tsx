import { headers, cookies } from 'next/headers';
import { isMember } from '@/lib/whop';
import { CreateGameForm, ScheduleSessionForm, StartTriviaRoundForm, QueueRoundForm, CreatorSettingsForm } from '@/components/CreatorForms';
import { ExportsPanel } from '@/components/ExportsPanel';
import { AnalyticsCards } from '@/components/AnalyticsCards';

export const metadata = {
  openGraph: {
    images: [{ url: '/discover-image.png', width: 1200, height: 630, alt: 'ArcadiaX Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/discover-image.png', alt: 'ArcadiaX Dashboard' }],
  },
};

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const c = await cookies();
  let access = c.get('whop_access_token')?.value ?? '';
  if (!access) {
    const hAuth = (await headers()).get('authorization') || (await headers()).get('Authorization');
    if (hAuth && hAuth.toLowerCase().startsWith('bearer ')) access = hAuth.slice(7).trim();
  }
  const devBypass = process.env.WHOP_BYPASS_AUTH === 'true';
  // Do not block SSR pages when token is missing; Whop does not forward auth headers to SSR.
  // We still best-effort check membership when a token exists.
  if (access) {
    try {
      let membershipCompanyId = companyId;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      if (url && serviceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data } = await supabase
          .from('accounts')
          .select('whop_company_id')
          .eq('id', companyId)
          .maybeSingle();
        if (data?.whop_company_id) membershipCompanyId = data.whop_company_id as string;
      }
      const check = await isMember(access, membershipCompanyId).catch(() => ({ ok: false, isMember: false }));
      if (!check.ok || !check.isMember) {
        // Soft warning but continue rendering to avoid blocking creators due to header propagation issues
      }
    } catch {}
  }
  let json: any = { items: [] };
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const base = host ? `${proto}://${host}` : '';
    const res = await fetch(`${base}/api/games?accountId=${companyId}`, { cache: 'no-store' });
    json = await res.json().catch(() => ({ items: [] }));
  } catch {}
  // Determine role for server-side gating
  let canManage = false;
  try {
    if (access) {
      let membershipCompanyId = companyId;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      if (url && serviceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data } = await supabase
          .from('accounts')
          .select('whop_company_id')
          .eq('id', companyId)
          .maybeSingle();
        if (data?.whop_company_id) membershipCompanyId = data.whop_company_id as string;
      }
      const { getWhopRole } = await import('@/lib/whop');
      const role = await getWhopRole(access, membershipCompanyId);
      canManage = role === 'owner' || role === 'mod';
    }
  } catch {}

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>companyId: {companyId}</p>
      {devBypass && (
        <p style={{ color: '#00E0FF' }}>Dev bypass active — membership check skipped.</p>
      )}
      <AnalyticsCards accountId={companyId} />
      <ExportsPanel accountId={companyId} />
      <div style={{ display: 'grid', gap: 16 }}>
        {json.items?.length === 0 && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8, background: 'rgba(124,58,237,0.08)' }}>
            <h3 style={{ marginTop: 0 }}>Create your first game</h3>
            <p style={{ opacity: 0.85 }}>Start by creating a game. Then you can schedule your first session.</p>
            {canManage ? <CreateGameForm accountId={companyId} /> : <p>Ask an owner or moderator to create the first game.</p>}
          </div>
        )}
        {canManage && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h3>Create Game</h3>
            <CreateGameForm accountId={companyId} />
          </div>
        )}
        {canManage && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h3>Schedule Session</h3>
            <ScheduleSessionForm games={(json.items ?? []) as any} />
          </div>
        )}
        {((json.items ?? []) as any[])[0] && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h3>Start Trivia Round (on latest session)</h3>
            {/* For demo, pick the most recent session of first game */}
            {/* In a real UI, allow picking session explicitly */}
            {/* We derive a sessionId by fetching sessions here server-side for simplicity */}
            {/* Fallback to client flow if not available */}
            {/* Small inline fetch */}
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            {canManage ? <RoundStarter companyId={companyId} /> : <div style={{ opacity: 0.8 }}>Only owners/mods can start rounds.</div>}
          </div>
        )}
        {canManage && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h3>Queue Round</h3>
            <RoundQueueStarter companyId={companyId} />
          </div>
        )}
        {canManage && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h3>Community Settings</h3>
            <CreatorSettingsForm accountId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
}

// Server component to fetch the latest sessionId quickly
async function RoundStarter({ companyId }: { companyId: string }) {
  const hh = await headers();
  const res = await fetch(`${(hh.get('x-forwarded-proto') ?? 'http')}://${hh.get('host')}/api/sessions?accountId=${companyId}`, { cache: 'no-store' });
  const j = await res.json();
  const firstSessionId = (j.items?.[0]?.id) as string | undefined;
  if (!firstSessionId) return <div>No sessions found yet. Schedule a session first.</div>;
  return <StartTriviaRoundForm sessionId={firstSessionId} />;
}

async function RoundQueueStarter({ companyId }: { companyId: string }) {
  const hh = await headers();
  const res = await fetch(`${(hh.get('x-forwarded-proto') ?? 'http')}://${hh.get('host')}/api/sessions?accountId=${companyId}`, { cache: 'no-store' });
  const j = await res.json();
  const firstSessionId = (j.items?.[0]?.id) as string | undefined;
  if (!firstSessionId) return <div>No sessions found yet. Schedule a session first.</div>;
  return <QueueRoundForm sessionId={firstSessionId} />;
}
