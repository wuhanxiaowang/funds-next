/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: 'standalone', // Docker / 容器部署时使用
  ...(basePath ? { basePath } : {}),
  
  // 优化配置
  compress: true, // 启用gzip压缩
  swcMinify: true, // 使用SWC进行代码压缩
  
  // 字体优化
  optimizeFonts: true,
  
  // 静态资源优化
  staticPageGenerationTimeout: 100,
  

}

module.exports = nextConfig
