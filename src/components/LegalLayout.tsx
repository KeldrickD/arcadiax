'use client';

import Link from 'next/link';
import { useMemo } from 'react';

type Props = {
	title: string;
	lastUpdated?: string;
	children: React.ReactNode;
};

export default function LegalLayout({ title, lastUpdated, children }: Props) {
	const year = useMemo(() => new Date().getFullYear(), []);
	return (
		<main style={{ minHeight: '100svh', width: '100%', background: '#0A0A0F', color: '#fff' }}>
			<header style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(8px)' }}>
				<div style={{ margin: '0 auto', maxWidth: 1200, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Link href="/" style={{ fontWeight: 600, letterSpacing: '-0.01em', textDecoration: 'none' }}>
						<span style={{ backgroundImage: 'linear-gradient(90deg,#7C3AED,#00E0FF,#7C3AED)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>ArcadiaX</span>
					</Link>
					<nav style={{ display: 'none' }} />
				</div>
			</header>
			<div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: -1 }}>
				<div style={{ position: 'absolute', top: -160, left: -160, height: 320, width: 320, borderRadius: '50%', filter: 'blur(64px)', background: 'rgba(124,58,237,0.18)' }} />
				<div style={{ position: 'absolute', bottom: -160, right: -160, height: 320, width: 320, borderRadius: '50%', filter: 'blur(64px)', background: 'rgba(0,224,255,0.18)' }} />
			</div>
			<section style={{ margin: '0 auto', maxWidth: 768, padding: '48px 24px 80px' }}>
				<div style={{ marginBottom: 24 }}>
					<p style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', backgroundImage: 'linear-gradient(90deg,#7C3AED,#00E0FF,#7C3AED)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>Legal</p>
					<h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 600, lineHeight: 1.2 }}>{title}</h1>
					{lastUpdated ? <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>Last updated: {lastUpdated}</p> : null}
				</div>
				<div style={{ borderRadius: 16, padding: '24px 28px', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
					{children}
				</div>
				<div style={{ marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
					<QuickLink href="/terms" label="Terms of Service" />
					<QuickLink href="/privacy" label="Privacy Policy" />
					<QuickLink href="/rules" label="Game Rules" />
				</div>
				<div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
					<Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>← Back to home</Link>
					<p>© {year} ArcadiaX</p>
				</div>
			</section>
		</main>
	);
}

function QuickLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			style={{
				display: 'block',
				borderRadius: 12,
				padding: 16,
				border: '1px solid rgba(255,255,255,0.08)',
				background: 'rgba(255,255,255,0.04)',
				textDecoration: 'none',
				color: 'rgba(255,255,255,0.9)'
			}}
		>
			<div style={{ fontWeight: 600 }}>{label}</div>
			<div style={{ color: 'rgba(255,255,255,0.65)', marginTop: 4, fontSize: 13 }}>Read the full policy</div>
		</Link>
	);
}


