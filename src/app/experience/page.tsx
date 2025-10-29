export const dynamic = "force-dynamic";

import { redirect } from 'next/navigation';

export default function ExperiencePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
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
      return redirect(`/experience/${encodeURIComponent(value)}`);
    }
  }

  return (
    <main className="min-h-screen" style={{ padding: '40px 24px' }}>
      <h1 className="text-3xl font-bold">ArcadiaX — Experience</h1>
      <p className="mt-2 opacity-80" style={{ marginTop: 8, opacity: 0.8 }}>
        Sessions will appear here. If you’re a reviewer, this confirms the app is live.
      </p>
    </main>
  );
}


