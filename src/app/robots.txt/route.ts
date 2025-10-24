export function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://arcadiax.games';
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${base.replace(/\/$/, '')}/sitemap.xml`,
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain' } });
}


