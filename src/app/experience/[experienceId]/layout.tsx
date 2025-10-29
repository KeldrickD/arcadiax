import CreatorNav from '@/components/CreatorNav';

export default function ExperienceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ experienceId: string }> }) {
  return (
    <div>
      {(async () => {
        const { experienceId } = await params;
        let navAccountId = experienceId;
        try {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
          if (url && serviceKey) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
            // If a Whop id is passed in the route, map to our account UUID for nav links
            const { data: byWhop } = await supabase
              .from('accounts')
              .select('id')
              .eq('whop_company_id', experienceId)
              .maybeSingle();
            if (byWhop?.id) navAccountId = byWhop.id as string;
          }
        } catch {}
        return <CreatorNav accountId={navAccountId} />;
      })()}
      <div>{children}</div>
    </div>
  );
}


