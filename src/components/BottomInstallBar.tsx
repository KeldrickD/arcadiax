'use client';

import { useEffect, useState } from 'react';

const INSTALL_URL = 'https://whop.com/apps/app_tdIWpN1FBD3t8e/install/';

export default function BottomInstallBar() {
  const [hidden, setHidden] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ax_install_bar_hidden');
      if (saved === '1') setHidden(true);
    } catch {}
    const onScroll = () => {
      const y = window.scrollY;
      setShow(y > 80);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (hidden || !show) return null;

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
      padding: '12px 16px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      background: 'rgba(10,10,15,0.7)',
      borderTop: '1px solid rgba(255,255,255,0.08)'
    }} className="md:hidden">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 640 }}>
        <button onClick={() => { setHidden(true); try { localStorage.setItem('ax_install_bar_hidden','1'); } catch {} }} aria-label="Dismiss" style={{
          appearance: 'none', border: 'none', background: 'transparent', color: '#aaa', fontSize: 18
        }}>×</button>
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '12px 14px'
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>Install ArcadiaX on Whop</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Spin up community games in minutes</div>
          </div>
          <a href={INSTALL_URL} target="_blank" rel="noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', color: '#0A0A0F',
            background: 'linear-gradient(90deg,#7C3AED,#00E0FF)',
            padding: '10px 14px', borderRadius: 10, fontWeight: 600
          }}>Install</a>
        </div>
      </div>
    </div>
  );
}


