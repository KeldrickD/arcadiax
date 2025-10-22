import { fetchWhopMembership } from '@/lib/whop';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!companyId) return new Response('companyId required', { status: 400 });
  if (!token) return new Response('Missing Bearer token', { status: 401 });

  const res = await fetchWhopMembership({ accessToken: token, companyId });
  if (!res.ok) {
    return new Response(JSON.stringify({ ok: false, status: res.status }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  const json = await res.json();
  return new Response(JSON.stringify({ ok: true, membership: json }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

