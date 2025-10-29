export const dynamic = "force-dynamic";

export default function GettingStartedPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Getting started</h1>
      <ol style={{ marginTop: 12 }}>
        <li>Ensure your Whop app passes an auth token to the iframe (we auto-detect).</li>
        <li>Go to Dashboard → Sessions to create and manage sessions.</li>
        <li>Open Experience to preview what members see and to share session links.</li>
        <li>Use Wallet to add credits for testing purchases.</li>
      </ol>
      <p style={{ marginTop: 12 }}>Need help? Email support@arcadiax.games.</p>
    </main>
  );
}


