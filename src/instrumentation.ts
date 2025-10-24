// This file configures the initialization of Sentry on the server/runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

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