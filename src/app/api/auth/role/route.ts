import { cookies } from 'next/headers';
import { getWhopRole } from '@/lib/whop';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return new Response('companyId required', { status: 400 });

  const c = await cookies();
  let token = c.get('whop_access_token')?.value ?? '';
  const authz = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!token && authz && authz.toLowerCase().startsWith('bearer ')) token = authz.slice(7).trim();
  if (!token) return new Response(JSON.stringify({ role: 'unknown', canManage: false }), { headers: { 'content-type': 'application/json' } });

  const role = await getWhopRole(token, companyId);
  const canManage = role === 'owner' || role === 'mod';
  return new Response(JSON.stringify({ role, canManage }), { headers: { 'content-type': 'application/json' } });
}


