'use client';

import { useEffect, useState } from 'react';

export default function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem('ax_cookie_ack') === '1') return; } catch {}
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 40 }}>
      <div style={{
        maxWidth: 800, margin: '0 auto', borderRadius: 12, padding: 12,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)', color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>
            We use minimal analytics and necessary cookies to improve reliability. See our <a href="/privacy" style={{ color: '#7C3AED' }}>Privacy Policy</a>.
          </p>
          <button onClick={() => { setShow(false); try { localStorage.setItem('ax_cookie_ack','1'); } catch {} }}
            style={{
              appearance: 'none', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.2)',
              color: '#0A0A0F', fontWeight: 700, padding: '8px 12px', borderRadius: 8
            }}>OK</button>
        </div>
      </div>
    </div>
  );
}


