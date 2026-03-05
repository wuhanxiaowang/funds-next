#!/usr/bin/env node
/**
 * 静态导出构建：临时移走 app/api，构建完成后恢复
 * 生产环境 API 由边缘函数提供，需配置 NEXT_PUBLIC_API_URL
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const apiDir = path.join(root, 'app', 'api')
const apiBackup = path.join(root, 'app', '_api_backup_static')

function exists(p) {
  try { return fs.statSync(p).isDirectory() } catch { return false }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name)
    const d = path.join(dest, name)
    if (fs.statSync(s).isDirectory()) copyDirRecursive(s, d)
    else fs.copyFileSync(s, d)
  }
}

function removeDir(p) {
  if (!exists(p)) return
  for (const name of fs.readdirSync(p)) {
    const full = path.join(p, name)
    if (fs.statSync(full).isDirectory()) removeDir(full)
    else fs.unlinkSync(full)
  }
  fs.rmdirSync(p)
}

console.log('静态构建：临时移走 app/api ...')
if (!exists(apiDir)) {
  console.log('app/api 不存在，直接构建')
} else {
  if (exists(apiBackup)) removeDir(apiBackup)
  copyDirRecursive(apiDir, apiBackup)
  removeDir(apiDir)
}

try {
  execSync('next build', { cwd: root, stdio: 'inherit' })
} finally {
  if (exists(apiBackup)) {
    console.log('恢复 app/api ...')
  }
  if (exists(apiBackup)) {
    copyDirRecursive(apiBackup, apiDir)
    removeDir(apiBackup)
  }
}

console.log('完成。产物在 out/。')
console.log('部署到 CF Pages：在 Dashboard 连接 Git，构建命令 npm run build:static，输出目录 out，根目录保留 functions/；或本地执行 wrangler pages deploy ./out --project-name=xxx，并确保 functions/ 同仓库一起部署。')
