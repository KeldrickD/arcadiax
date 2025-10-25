import BottomInstallBar from '@/components/BottomInstallBar';
import Image from 'next/image';

const INSTALL_URL = 'https://whop.com/apps/app_tdIWpN1FBD3t8e/install/';

export default function Home() {
  return (
    <main style={{ minHeight: '100svh', background: '#0A0A0F', color: '#fff' }}>
      <Hero />
      <div className="ax-divider" />
      <GamesCarousel />
      <div className="ax-divider" />
      <StatsSection />
      <div className="ax-divider" />
      <HowItWorks />
      <div className="ax-divider" />
      <CTA />
      <BottomInstallBar />
    </main>
  );
}

function Hero() {
  return (
    <section style={{ position: 'relative', padding: '80px 24px 40px' }} className="hero-animated">
      <div style={{ margin: '0 auto', maxWidth: 1100, textAlign: 'center' }}>
        <h1 style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Mini Games. Major Retention.
        </h1>
        <p style={{ marginTop: 12, fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>
          Launch trivia, prediction, and raffle sessions in minutes. Built for Whop creators.
        </p>
        <p style={{ marginTop: 8, fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>
          Built for creators who want to make their communities play again.
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href={INSTALL_URL} target="_blank" rel="noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', color: '#0A0A0F',
            background: 'linear-gradient(90deg,#7C3AED,#00E0FF)',
            padding: '12px 16px', borderRadius: 12, fontWeight: 700
          }}>Install on Whop</a>
          <a href="#how" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', color: '#fff',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 16px', borderRadius: 12, fontWeight: 600
          }}>How it works</a>
        </div>
      </div>
    </section>
  );
}

function GamesCarousel() {
  const items = [
    { title: 'Trivia', desc: 'Fast rounds. Instant winners.', color: '#7C3AED', image: '/trivia-card-image.png' },
    { title: 'Prediction', desc: 'Closest forecast wins.', color: '#00E0FF', image: '/prediction-card-image.png' },
    { title: 'Raffle', desc: 'Lucky draws, daily.', color: '#22D3EE', image: '/raffle-card-image.png', imagePosition: 'center 30%' },
    { title: 'Spin', desc: 'Wheel of rewards.', color: '#F472B6' },
  ];
  return (
    <section style={{ padding: '24px 0' }}>
      <div style={{ margin: '0 auto', maxWidth: 1100, padding: '0 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Games</h2>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8 }}>
          {items.map((it, i) => (
            <div key={i} style={{ minWidth: 260, scrollSnapAlign: 'start', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }} className="ax-card">
              {it.image ? (
                <div style={{ position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  <Image src={it.image} alt={`${it.title} game card`} fill sizes="260px" style={{ objectFit: 'cover', objectPosition: (it as any).imagePosition ?? 'center' }} />
                </div>
              ) : (
                <div style={{ height: 120, borderRadius: 12, background: it.color, opacity: 0.6, marginBottom: 12 }} />
              )}
              <div style={{ fontWeight: 600 }}>{it.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)' }}>{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section style={{ padding: '24px 0' }}>
      <div style={{ margin: '0 auto', maxWidth: 1100, padding: '0 24px', display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <div style={{ borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }} className="ax-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Avg. Session Retention</span>
            <span className="ax-badge" aria-label="Live Data badge">Live Data</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>+34%</div>
          <div style={{ height: 90, marginTop: 12, borderRadius: 10, background: 'linear-gradient(180deg,rgba(124,58,237,0.25),transparent)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div style={{ borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }} className="ax-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Players This Week</span>
            <span className="ax-badge" aria-label="Live Data badge">Live Data</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>2,481</div>
          <div style={{ height: 90, marginTop: 12, borderRadius: 10, background: 'linear-gradient(180deg,rgba(0,224,255,0.25),transparent)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div style={{ borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }} className="ax-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Games Run</span>
            <span className="ax-badge" aria-label="Live Data badge">Live Data</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>12,930</div>
          <div style={{ height: 90, marginTop: 12, borderRadius: 10, background: 'linear-gradient(180deg,rgba(34,211,238,0.25),transparent)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Install on Whop', desc: 'One-click install to your workspace.' },
    { title: 'Create a Game', desc: 'Pick trivia, prediction, or raffle.' },
    { title: 'Go Live', desc: 'Start a session and share the link.' },
  ];
  return (
    <section id="how" style={{ padding: '24px 0' }}>
      <div style={{ margin: '0 auto', maxWidth: 900, padding: '0 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>How it Works</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }} className="ax-card">
              <div style={{ fontWeight: 600 }}>{i + 1}. {s.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: '24px 0 80px' }}>
      <div style={{ margin: '0 auto', maxWidth: 900, padding: '0 24px', textAlign: 'center' }}>
        <div style={{ borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }} className="ax-card">
          <h3 style={{ fontSize: 22, fontWeight: 700 }}>Ready to play?</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)' }}>Install ArcadiaX on Whop and host your first session today.</p>
          <div style={{ marginTop: 14 }}>
            <a href={INSTALL_URL} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', color: '#0A0A0F',
              background: 'linear-gradient(90deg,#7C3AED,#00E0FF)',
              padding: '12px 16px', borderRadius: 12, fontWeight: 700
            }}>Install on Whop</a>
          </div>
        </div>
      </div>
    </section>
  );
}


