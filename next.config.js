/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  // For subdirectory deployments, uncomment and set the basePath:
  // basePath: '/your-subdirectory',
  // env: {
  //   NEXT_PUBLIC_BASE_PATH: '/your-subdirectory'
  // }
}

module.exports = nextConfig 