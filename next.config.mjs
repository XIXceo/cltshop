/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Admin can provide external image URLs; allow remote sources in production via env/config if needed.
    remotePatterns: [],
  },
};

export default nextConfig;

