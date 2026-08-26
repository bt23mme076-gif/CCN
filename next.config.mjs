/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' output is only needed for the Dockerfile (unused VPS deploy path).
  // It breaks Vercel's own build/tracing pipeline, so skip it there.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  poweredByHeader: false,
  // instrumentation.ts is picked up automatically since Next 15 — the old
  // experimental.instrumentationHook flag was removed.
  serverExternalPackages: ['web-push'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
