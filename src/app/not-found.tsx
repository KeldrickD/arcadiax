export default function NotFound() {
  return (
    <div style={{ minHeight: '60svh', display: 'grid', placeItems: 'center', color: '#fff', background: '#0A0A0F', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)' }}>The page you’re looking for doesn’t exist.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 16, color: '#0A0A0F', background: 'linear-gradient(90deg,#7C3AED,#00E0FF)', padding: '10px 14px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Back home</a>
      </div>
    </div>
  );
}


