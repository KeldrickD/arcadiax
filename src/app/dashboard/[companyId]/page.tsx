import { headers, cookies } from 'next/headers';
import { isMember } from '@/lib/whop';

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const c = cookies();
  const access = c.get('whop_access_token')?.value ?? '';
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
  const res = await fetch(`/api/games?accountId=${companyId}`, { cache: 'no-store' });
  const json = await res.json();
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>companyId: {companyId}</p>
      <h3>Games</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(json.items ?? [], null, 2)}</pre>
    </div>
  );
}
