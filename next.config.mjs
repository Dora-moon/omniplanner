/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Firebase Storage download URLs live on this host — allow them for
    // next/image if you switch <img> tags to next/image later.
    remotePatterns: [{ protocol: 'https', hostname: 'firebasestorage.googleapis.com' }],
  },
};

export default nextConfig;
