import CreatorNav from '@/components/CreatorNav';

export default function ExperienceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ experienceId: string }> }) {
  return (
    <div>
      {(async () => {
        const { experienceId } = await params;
        return <CreatorNav accountId={experienceId} />;
      })()}
      <div>{children}</div>
    </div>
  );
}


