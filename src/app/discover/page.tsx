export const metadata = {
  title: 'Whop Games — Play. Compete. Connect.',
  description: 'Whop Games is a collection of mini-games built for creators to make their communities play again. Powered by ArcadiaX, it brings engagement, competition, and retention directly inside Whop.',
  openGraph: {
    title: 'Whop Games — Play. Compete. Connect.',
    description: 'Trivia, predictions, raffles, and spins for Whop creators. Mini games that boost engagement and retention.',
    url: 'https://whopgames.com',
    images: [{ url: '/discover-image.png', width: 1280, height: 720, alt: 'Whop Games — Play. Compete. Connect.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whop Games — Play. Compete. Connect.',
    description: 'Trivia, predictions, raffles, and spins for Whop creators. Mini games that boost engagement and retention.',
    images: [{ url: '/discover-image.png', alt: 'Whop Games — Play. Compete. Connect.' }],
  },
};

export default function DiscoverPage() {
  return (
    <div style={{ padding: 24, color: '#fff', background: '#0A0A0F' }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Whop Games</h1>
      <p style={{ color: '#cfcfe1', marginBottom: 24 }}>
        Whop Games is a collection of mini-games built for creators to make their communities play again.
        Powered by ArcadiaX, it brings engagement, competition, and retention directly inside Whop.
      </p>

      <p style={{ color: '#cfcfe1', marginBottom: 24 }}>
        Every game is designed to help creators energize their community, reward participation, and boost revenue — without leaving their workspace.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 16 }}>Core Features</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 24px 0', color: '#cfcfe1' }}>
        <li>🧠 Trivia Rounds — Quick questions, instant winners.</li>
        <li>🔮 Prediction Games — Closest forecast wins.</li>
        <li>🎟️ Raffles — Lucky draws made effortless.</li>
        <li>🎡 Wheel Spins — Reward members in real time.</li>
        <li>💰 Creator Dashboard — Track GMV, credits, retention, and growth.</li>
        <li>🔔 Feed & Push Automation — Announce winners automatically, keep members engaged.</li>
        <li>🔒 Secure Wallet + Checkout — Powered by Whop’s payment infrastructure.</li>
      </ul>

      <h2 style={{ fontSize: 24, marginTop: 16 }}>Built for Creators</h2>
      <ul style={{ listStyle: 'disc', marginLeft: 20, color: '#cfcfe1' }}>
        <li>Keep members coming back daily</li>
        <li>Create excitement between content drops</li>
        <li>Monetize engagement directly</li>
        <li>Build a gamified layer into your brand</li>
      </ul>

      <h2 style={{ fontSize: 24, marginTop: 16 }}>Powered by ArcadiaX</h2>
      <p style={{ color: '#cfcfe1', marginBottom: 16 }}>
        Whop Games is developed by ArcadiaX, a next-generation gaming infrastructure for creators. Together, they’re redefining what digital community engagement looks like — where fun meets retention, and every click counts.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 16 }}>Our Mission</h2>
      <p style={{ color: '#cfcfe1' }}>
        We believe the future of online communities is interactive, not passive. Whop Games turns engagement into a game — because when your members play, they stay.
      </p>
    </div>
  );
}

