export default function sitemap() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://arcadiax.games').replace(/\/$/, '');
  const routes = ['/', '/terms', '/privacy', '/rules'];
  const now = new Date().toISOString();
  return routes.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: 'weekly', priority: path === '/' ? 1 : 0.6 }));
}


