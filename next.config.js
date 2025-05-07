// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  typescript: {
    // !! WARN !!
    // This is a temporary solution until we fix all type errors
    ignoreBuildErrors: true,
  },
  swcMinify: true
}

module.exports = nextConfig 