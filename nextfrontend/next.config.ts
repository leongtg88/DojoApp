import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.98.1'],
  // Identificador único del despliegue. Next lo inyecta como `data-dpl-id` en
  // <html> y, si un cliente con un build viejo navega contra el servidor nuevo,
  // fuerza una navegación dura (protección de version skew). El mismo valor se
  // expone en /api/app-version para que UpdatePrompt avise al usuario que puede
  // actualizar. Mantener la cadena sincronizada con app/api/app-version/route.ts.
  deploymentId:
    process.env.NEXT_DEPLOYMENT_ID ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
      },
    ]
  },
  async headers() {
    // En desarrollo React/Turbopack usan eval() para HMR; se permite solo en
    // ese entorno. En producción el CSP se mantiene estricto.
    const isDev = process.env.NODE_ENV !== 'production'

    const scriptSources = [
      "'self'",
      "'unsafe-inline'",
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      ...(isDev ? ["'unsafe-eval'"] : []),
    ]

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline' en script-src se mantiene a propósito: Next.js
              // App Router inyecta sus scripts de bootstrap/hidratación inline y
              // las páginas públicas son estáticas, así que nonces/strict-dynamic
              // exigirían render dinámico global (regresión de SEO/perf). El resto
              // de directivas se mantiene estricto.
              `script-src ${scriptSources.join(' ')}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://www.facebook.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://analytics.google.com https://*.vercel-analytics.com https://connect.facebook.net https://www.facebook.com",
              "frame-src 'self' https://www.google.com https://maps.google.com",
              "object-src 'none'",
              "worker-src 'self'",
              "manifest-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;