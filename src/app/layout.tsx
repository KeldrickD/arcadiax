import CookieNotice from '@/components/CookieNotice';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
export const metadata = {
  title: 'Whop Games | Powered by ArcadiaX',
  description: 'Whop Games by ArcadiaX — mini-games for Whop creators that drive engagement, retention, and monetization. Launch trivia, prediction, raffle, and spin games directly inside your Whop community. Built for creators who want to make their members play again. https://whopgames.com',
  metadataBase: new URL('https://whopgames.com'),
  keywords: [
    'whop games',
    'arcadiax',
    'whop app',
    'whop community',
    'creator engagement',
    'trivia games',
    'prediction games',
    'raffles',
    'spin wheel',
    'retention tools',
    'whop plugins',
    'whop mini apps',
  ],
  openGraph: {
    title: 'Whop Games — Play. Compete. Connect.',
    description: 'Trivia, predictions, raffles, and spins for Whop creators. Mini games that boost engagement and retention.',
    url: 'https://whopgames.com',
    images: [{ url: '/discover-image.png', width: 1280, height: 720, alt: 'Whop Games — Play. Compete. Connect.' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ArcadiaXGames',
    title: 'Whop Games — Play. Compete. Connect.',
    description: 'Trivia, predictions, raffles, and spins for Whop creators. Mini games that boost engagement and retention.',
    images: [{ url: '/discover-image.png', alt: 'Whop Games — Play. Compete. Connect.' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Whop Games',
          url: 'https://whopgames.com',
          sameAs: ['https://whop.com/apps/app_tdIWpN1FBD3t8e/install/'],
        }) }} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Whop Games',
          url: 'https://whopgames.com',
        }) }} />
        {children}
        <CookieNotice />
        <Analytics />
        <footer style={{ padding: 16, marginTop: 40, borderTop: '1px solid #222', textAlign: 'center', color: '#aaa' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ marginBottom: 8, color: '#bbb' }}>
              Whop Games by ArcadiaX — mini-games for Whop creators that drive engagement, retention, and monetization. Launch trivia, prediction, raffle, and spin games directly inside your Whop community. Built for creators who want to make their members play again. <a href="https://whopgames.com" style={{ color: '#7C3AED' }}>whopgames.com</a>
            </div>
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

