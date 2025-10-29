import CreatorNav from '@/components/CreatorNav';

export default function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ companyId: string }> }) {
  return (
    <div>
      {(async () => {
        const { companyId } = await params;
        let navAccountId = companyId;
        try {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
          if (url && serviceKey) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
            const { data } = await supabase
              .from('accounts')
              .select('id')
              .eq('whop_company_id', companyId)
              .maybeSingle();
            if (data?.id) navAccountId = data.id as string;
          }
        } catch {}
        return <CreatorNav accountId={navAccountId} />;
      })()}
      <div>{children}</div>
    </div>
  );
}


