import LegalLayout from '@/components/LegalLayout';
import RulesContent from '@/content/rules.mdx';

export default function Page() {
  return (
    <LegalLayout title="Game Rules" lastUpdated="October 2025">
      <RulesContent />
    </LegalLayout>
  );
}


