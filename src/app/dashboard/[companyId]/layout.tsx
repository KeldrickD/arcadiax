import CreatorNav from '@/components/CreatorNav';

export default function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ companyId: string }> }) {
  return (
    <div>
      {/* Await params per Next 15 server components */}
      {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
      {(async () => {
        const { companyId } = await params;
        return <CreatorNav accountId={companyId} />;
      })()}
      <div>{children}</div>
    </div>
  );
}


