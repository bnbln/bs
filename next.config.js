/** @type {import('next').NextConfig} */
const isAdminBackend =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'

const nextConfig = {
  // Keep backend/editor dev artifacts separate from the regular frontend dev server.
  distDir: isAdminBackend ? '.next-backend' : '.next',
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },

  experimental: {
    // Prevent the dev-only admin assets endpoint from tracing all media files into
    // the deployed serverless function bundle on Vercel.
    outputFileTracingExcludes: {
      '/api/admin/assets': ['./public/assets/**/*'],
    },
  },
  
  // Cache headers for better asset caching
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year cache
          },
        ],
      },
      {
        source: '/book-webp/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year cache
          },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.mp4',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
    ];
  },
  
  // For subdirectory deployments, uncomment and set the basePath:
  // basePath: '/your-subdirectory',
  // env: {
  //   NEXT_PUBLIC_BASE_PATH: '/your-subdirectory'
  // }
}

module.exports = nextConfig 
