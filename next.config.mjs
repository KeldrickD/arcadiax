import {withSentryConfig} from '@sentry/nextjs';
import createMDX from '@next/mdx';
/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key:'Strict-Transport-Security', value:'max-age=31536000; includeSubDomains; preload' },
  { key:'X-Content-Type-Options', value:'nosniff' },
  { key:'X-Frame-Options', value:'DENY' },
  { key:'Referrer-Policy', value:'strict-origin-when-cross-origin' },
  { key:'Permissions-Policy', value:'geolocation=(), microphone=(), camera=()' },
  { key:'Content-Security-Policy', value:[
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' vercel.live",
      "style-src 'self' 'unsafe-inline' fonts.gstatic.com fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co https://api.whop.com",
      "font-src 'self' fonts.gstatic.com",
      "frame-ancestors 'none'"
    ].join('; ') }
];

const withMDX = createMDX({});

const baseNextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      // 301 host redirect: arcadiax.games -> whopgames.com
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'arcadiax.games',
          },
        ],
        destination: 'https://whopgames.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.arcadiax.games',
          },
        ],
        destination: 'https://whopgames.com/:path*',
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

const nextConfig = withMDX(baseNextConfig);

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "keldrick",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});
