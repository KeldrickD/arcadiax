import * as Sentry from "@sentry/nextjs";

(() => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES ?? process.env.SENTRY_TRACES ?? 1),
    enableLogs: String(process.env.SENTRY_ENABLE_LOGS ?? 'true') === 'true',
    replaysSessionSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSIONS ?? 0.1),
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERRORS ?? 1.0),
    sendDefaultPii: String(process.env.SENTRY_SEND_PII ?? 'true') === 'true',
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  });
})();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

