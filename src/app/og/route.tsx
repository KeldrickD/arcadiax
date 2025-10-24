import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const fontData = await fetch(new URL('../../../public/next.svg', import.meta.url)).then(() => null).catch(() => null);
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0F',
          color: '#fff',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: -120, left: -120, width: 240, height: 240, borderRadius: '50%', background: 'rgba(124,58,237,0.3)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -120, right: -120, width: 240, height: 240, borderRadius: '50%', background: 'rgba(0,224,255,0.3)', filter: 'blur(60px)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>ArcadiaX</div>
          <div style={{ marginTop: 12, fontSize: 28, color: 'rgba(255,255,255,0.85)' }}>Mini Games. Major Retention.</div>
          <div style={{ marginTop: 8, fontSize: 18, color: 'rgba(255,255,255,0.65)' }}>Built for Whop creators</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}


