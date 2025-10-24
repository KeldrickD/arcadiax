// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry only if DSN provided
(() => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES ?? process.env.SENTRY_TRACES ?? 1),
    enableLogs: String(process.env.SENTRY_ENABLE_LOGS ?? 'true') === 'true',
    sendDefaultPii: String(process.env.SENTRY_SEND_PII ?? 'true') === 'true',
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  });
})();

export function withSentry<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<Response>,
  routeName?: string
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err: any) {
      try {
        Sentry.captureException(err, { tags: { route: routeName || 'unknown' } });
      } catch {}
      const message = err instanceof Error ? err.message : 'internal_error';
      return new Response(JSON.stringify({ ok: false, error: message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  };
}

export function logRequest(route: string, extra?: Record<string, unknown>): void {
  const payload = { route, ts: Date.now(), ...(extra || {}) };
  try { Sentry.captureMessage(`api:${route}`, { level: 'info', extra: payload }); } catch {}
  try { console.log(JSON.stringify(payload)); } catch {}
}
