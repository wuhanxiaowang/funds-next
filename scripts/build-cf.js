#!/usr/bin/env node
/**
 * 使用 @cloudflare/next-on-pages 构建，输出到 .vercel/output/static
 * 部署: wrangler pages deploy .vercel/output/static --project-name your-project
 */
process.env.BUILD_CF = '1'
const { execSync } = require('child_process')
const path = require('path')
const projectRoot = path.join(__dirname, '..')

try {
  // 尝试使用 npx
  execSync('npx @cloudflare/next-on-pages@1', {
    stdio: 'inherit',
    env: process.env,
    cwd: projectRoot,
  })
} catch (error) {
  console.log('npx 执行失败，尝试使用 npm exec...')
  // 尝试使用 npm exec
  execSync('npm exec -- @cloudflare/next-on-pages@1', {
    stdio: 'inherit',
    env: process.env,
    cwd: projectRoot,
  })
}
