import LegalLayout from '@/components/LegalLayout';
import PrivacyContent from '@/content/privacy.mdx';

export default function Page() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="October 2025">
      <PrivacyContent />
    </LegalLayout>
  );
}


