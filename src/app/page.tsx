export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>ArcadiaX</h1>
      <p>Whop OAuth scaffold added.</p>
      <ul>
        <li>
          OAuth callback: <code>/api/auth/whop/callback</code>
        </li>
        <li>
          Membership check: <code>/api/membership?companyId=YOUR_COMPANY_ID</code> with <code>Authorization: Bearer ACCESS_TOKEN</code>
        </li>
      </ul>
    </div>
  );
}
