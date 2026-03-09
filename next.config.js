/** @type {import('next').NextConfig} */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

// 生成版本号：优先使用Git提交哈希，如果没有Git则使用package.json版本+完整时间戳
function generateVersion() {
  try {
    // 尝试获取Git提交哈希（前8位）
    const gitHash = execSync('git rev-parse --short HEAD', { 
      cwd: __dirname, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'] // 忽略错误
    }).trim()
    
    if (gitHash) {
      return `${gitHash}`
    }
  } catch (e) {
    // Git不可用，使用备用方案
  }
  
  // 备用方案：读取package.json版本 + 完整时间戳（确保每次构建都有唯一版本号）
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))
    const version = packageJson.version || '1.0.0'
    const buildTime = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '') // 年月日时分秒
    return `${version}-${buildTime}`
  } catch (e) {
    // 如果都失败，使用固定版本
    return '1.0.0'
  }
}

const buildVersion = generateVersion()
console.log(`构建版本号: ${buildVersion}`)

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
  
  // 环境变量
  env: {
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },

}

module.exports = nextConfig