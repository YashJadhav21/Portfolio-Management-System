/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from the backend during development
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
