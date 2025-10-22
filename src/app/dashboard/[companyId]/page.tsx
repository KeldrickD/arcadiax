import { headers, cookies } from 'next/headers';
import { isMember } from '@/lib/whop';
import { CreateGameForm, ScheduleSessionForm, StartTriviaRoundForm } from '@/components/CreatorForms';

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const c = cookies();
  const access = c.get('whop_access_token')?.value ?? '';
  const devBypass = process.env.WHOP_BYPASS_AUTH === 'true';
  if (!devBypass) {
    if (!access) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Dashboard</h2>
          <p>Sign in via Whop to continue.</p>
        </div>
      );
    }
    const check = await isMember(access, companyId).catch(() => ({ ok: false, isMember: false }));
    if (!check.ok || !check.isMember) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Dashboard</h2>
          <p>Membership required for this community.</p>
        </div>
      );
    }
  }
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const base = host ? `${proto}://${host}` : '';
  const res = await fetch(`${base}/api/games?accountId=${companyId}`, { cache: 'no-store' });
  const json = await res.json();
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>companyId: {companyId}</p>
      {devBypass && (
        <p style={{ color: '#00E0FF' }}>Dev bypass active — membership check skipped.</p>
      )}
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <h3>Create Game</h3>
          <CreateGameForm accountId={companyId} />
        </div>
        <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <h3>Schedule Session</h3>
          <ScheduleSessionForm games={(json.items ?? []) as any} />
        </div>
        {((json.items ?? []) as any[])[0] && (
          <div style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h3>Start Trivia Round (on latest session)</h3>
            {/* For demo, pick the most recent session of first game */}
            {/* In a real UI, allow picking session explicitly */}
            {/* We derive a sessionId by fetching sessions here server-side for simplicity */}
            {/* Fallback to client flow if not available */}
            {/* Small inline fetch */}
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <RoundStarter companyId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
}

// Server component to fetch the latest sessionId quickly
async function RoundStarter({ companyId }: { companyId: string }) {
  const res = await fetch(`${(headers().get('x-forwarded-proto') ?? 'http')}://${headers().get('host')}/api/sessions?accountId=${companyId}`, { cache: 'no-store' });
  const j = await res.json();
  const firstSessionId = (j.items?.[0]?.id) as string | undefined;
  if (!firstSessionId) return <div>No sessions found yet. Schedule a session first.</div>;
  return <StartTriviaRoundForm sessionId={firstSessionId} />;
}
