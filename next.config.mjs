/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix SWC binary issues on Windows
  experimental: {
    turbo: {
      // Reduce Turbopack console noise
      loaders: {},
    },
  },
  // Suppress non-critical dev warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
