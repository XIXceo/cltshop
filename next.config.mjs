/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: '.next',
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

