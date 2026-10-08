/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    // Images are now stored as base64 data URLs inside Firestore, so no
    // remote host whitelisting is needed for next/image.
    remotePatterns: [],
  },
};

export default nextConfig;
