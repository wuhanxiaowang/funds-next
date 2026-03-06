/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: 'standalone', // Docker / 容器部署时使用
}

module.exports = nextConfig
