export const metadata = {
  openGraph: {
    images: [{ url: '/discover-image.png', width: 1200, height: 630, alt: 'ArcadiaX Discover' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/discover-image.png', alt: 'ArcadiaX Discover' }],
  },
};

export default function DiscoverPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Discover</h2>
      <p>Public marketing/install funnel</p>
    </div>
  );
}

