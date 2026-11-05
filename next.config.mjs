/** @type {import('next').NextConfig} */
const nextConfig = {
  // Courses used to have their own pages; they now open inside Past Papers.
  async redirects() {
    return [
      { source: "/courses", destination: "/search", permanent: true },
      { source: "/courses/:code", destination: "/search?course=:code", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
