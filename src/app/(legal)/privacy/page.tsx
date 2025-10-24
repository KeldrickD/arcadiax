export const metadata = { title: 'Privacy Policy — ArcadiaX' };

export default function Page() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> October 2025</p>
      <h3>What We Collect</h3>
      <ul>
        <li>Whop data: name, avatar, email ID, company ID</li>
        <li>Gameplay data: sessions joined, scores, credit balance</li>
        <li>Technical data: IP, device, browser (for security)</li>
        <li>Diagnostics: Sentry error reports (non-sensitive)</li>
      </ul>
      <h3>How We Use It</h3>
      <ul>
        <li>Authenticate users and run games</li>
        <li>Process payments/refunds via Whop</li>
        <li>Improve reliability, security, analytics</li>
        <li>Send essential notifications</li>
      </ul>
      <h3>Sharing</h3>
      <ul>
        <li>Whop (login & billing)</li>
        <li>Supabase (database & realtime)</li>
        <li>Sentry/analytics (stability monitoring)</li>
      </ul>
      <p>We never sell personal data.</p>
      <h3>Retention & Control</h3>
      <p>Data retained while Whop connection remains active. Request deletion at privacy@arcadiax.games.</p>
      <h3>Security</h3>
      <p>HTTPS, HSTS, RLS. Staff access is minimal and logged.</p>
      <h3>Children</h3>
      <p>Not directed to children under 13.</p>
      <h3>Updates</h3>
      <p>Revisions appear here with a new “Last Updated”.</p>
    </article>
  );
}


