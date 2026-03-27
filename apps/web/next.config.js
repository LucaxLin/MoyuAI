/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@moyu/shared', '@moyu/db'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

module.exports = nextConfig;
