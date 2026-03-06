/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: 'standalone', // Docker / 容器部署时使用
  ...(basePath ? { basePath } : {}),
}

module.exports = nextConfig
