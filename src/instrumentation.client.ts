import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e230a3ca7165419e5865dafc71798dce@o4510242750988288.ingest.us.sentry.io/4510242752823296",
  integrations: [
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

