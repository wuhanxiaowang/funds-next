/**
 * 阿里云 ESA 静态导出构建：临时隐藏 app/api 以便 next build 能执行 output: 'export'
 * 构建产物在 out/ 目录，ESA 需配置 assets.directory = "out"
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const apiDir = path.join(root, 'app', 'api')
const apiBackup = path.join(root, 'app', '_api_export_hide')

function run() {
  if (!fs.existsSync(apiDir)) {
    console.log('app/api 不存在，直接执行 next build')
    execSync('npm run build', { cwd: root, stdio: 'inherit' })
    return
  }
  console.log('临时隐藏 app/api 以支持静态导出...')
  fs.renameSync(apiDir, apiBackup)
  try {
    execSync('npx next build', { cwd: root, stdio: 'inherit', env: { ...process.env, BUILD_FOR_ESA: '1' } })
  } finally {
    console.log('恢复 app/api')
    fs.renameSync(apiBackup, apiDir)
  }
}

run()
