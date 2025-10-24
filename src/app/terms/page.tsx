import LegalLayout from '@/components/LegalLayout';
import TermsContent from '@/content/terms.mdx';

export default function Page() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="October 2025">
      <TermsContent />
    </LegalLayout>
  );
}


