export default function OAuthPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Whop OAuth</h2>
      <p>Click to start OAuth flow in a new tab/window.</p>
      <a
        href="/api/auth/whop/start"
        style={{
          display: 'inline-block',
          marginTop: 12,
          padding: '8px 12px',
          borderRadius: 8,
          background: '#7C3AED',
          color: '#fff',
          textDecoration: 'none',
        }}
      >
        Connect Whop
      </a>
    </div>
  );
}

