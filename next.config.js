/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // 阿里云 ESA 构建时使用静态导出，产出 out/ 目录供 CDN 托管
  ...(process.env.BUILD_FOR_ESA === '1' ? { output: 'export' } : {}),
}

module.exports = nextConfig
