/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Long-lived, immutable caching for all static media so images and
        // videos are served instantly from Vercel's edge CDN on repeat visits.
        // (If you replace a file, give it a new name to bust the cache.)
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
