/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    USE_MOCKS: process.env.USE_MOCKS ?? "",
  },
  experimental: {
    serverComponentsExternalPackages: ["bullmq", "ioredis", "cheerio", "pdfkit"],
  },
};

export default nextConfig;
