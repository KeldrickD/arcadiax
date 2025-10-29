import { withSentry, logRequest } from '@/sentry.server.config';

export async function GET(request: Request) {
  // Allow GET for simple connectivity checks during development
  return await POST(request);
}

export const POST = withSentry(async (request: Request) => {
  logRequest('/api/sentry/webhook');

  const rawBody = await request.text().catch(() => '');

  // Best-effort signature verification
  try {
    const secret = process.env.SENTRY_WEBHOOK_SECRET;
    const signatureHeader = request.headers.get('sentry-hook-signature') || request.headers.get('x-sentry-signature') || '';
    if (secret && signatureHeader && rawBody) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
      const hex = bufferToHex(digest);
      // If the computed digest doesn't match, we reject
      if (hex !== signatureHeader) {
        return new Response('invalid signature', { status: 400 });
      }
    }
  } catch {
    // If verification fails unexpectedly, do not block delivery
  }

  // Try parse payload for basic validation/logging
  let json: any = null;
  try {
    json = rawBody ? JSON.parse(rawBody) : null;
  } catch {}

  return new Response(JSON.stringify({ ok: true, received: Boolean(json) }), {
    headers: { 'content-type': 'application/json' },
  });
}, '/api/sentry/webhook');

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, '0');
    hex += h;
  }
  return hex;
}


