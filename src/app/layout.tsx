import CookieNotice from '@/components/CookieNotice';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
export const metadata = {
  title: 'ArcadiaX',
  metadataBase: new URL('https://arcadiax.games'),
  openGraph: {
    title: 'ArcadiaX — Mini Games. Major Retention.',
    description: 'Launch trivia, prediction, and raffle sessions in minutes. Built for Whop creators.',
    url: 'https://arcadiax.games',
    images: [{ url: '/og', width: 1200, height: 630, alt: 'ArcadiaX — Mini Games. Major Retention.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArcadiaX — Mini Games. Major Retention.',
    description: 'Launch trivia, prediction, and raffle sessions in minutes. Built for Whop creators.',
    images: [{ url: '/og', alt: 'ArcadiaX — Mini Games. Major Retention.' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ArcadiaX',
          url: 'https://arcadiax.games',
          sameAs: ['https://whop.com/apps/app_tdIWpN1FBD3t8e/install/'],
        }) }} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ArcadiaX',
          url: 'https://arcadiax.games',
        }) }} />
        {children}
        <CookieNotice />
        <Analytics />
        <footer style={{ padding: 16, marginTop: 40, borderTop: '1px solid #222', textAlign: 'center', color: '#aaa' }}>
          <div style={{ marginBottom: 8 }}>
            <span>Credits are not cash and have no cash value. Refunds only for cancelled/errored sessions.</span>
            <span> &nbsp;|&nbsp; </span>
            <span>No-purchase necessary entry available daily (raffles).</span>
          </div>
          <div>
            <a href="/terms" style={{ color: '#7C3AED' }}>Terms</a> · <a href="/privacy" style={{ color: '#7C3AED' }}>Privacy</a> · <a href="/rules" style={{ color: '#7C3AED' }}>Game Rules</a>
          </div>
        </footer>
      </body>
    </html>
  );
}

