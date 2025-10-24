// Optional Sentry client init. Only activates when NEXT_PUBLIC_SENTRY_DSN is set
(() => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  (async () => {
    try {
      const Sentry: any = await import(/* webpackIgnore: true */ '@sentry/browser');
      Sentry.init({
        dsn,
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES ?? '0.1'),
        environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      });
    } catch {
      // Sentry not installed; skip
    }
  })();
})();


