/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'
const useCfBuild = process.env.BUILD_CF === '1' || process.env.CF_PAGES === '1'
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // 开发模式和 Cloudflare Pages 构建时使用动态渲染，保留 API 路由
  // 只有非 Cloudflare Pages 的生产构建才使用静态导出
  // 但为了避免静态导出模式下的 API 路由问题，暂时禁用静态导出
  // ...(!isDev && !useCfBuild ? { output: 'export', distDir: 'out' } : {}),
}

module.exports = nextConfig
