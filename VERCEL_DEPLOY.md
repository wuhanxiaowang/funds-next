# Vercel 部署说明

## 一、前置

- 代码已推送到 **GitHub**（或 GitLab/Bitbucket）
- 已注册 [Vercel](https://vercel.com)，并已用 GitHub 账号登录

## 二、导入并部署

1. 打开 [Vercel](https://vercel.com) → **Add New** → **Project**
2. 选择 **Import Git Repository**，找到并导入 **funds-next** 仓库
3. **Framework Preset** 保持 **Next.js**，**Root Directory** 留空
4. **Build Command**：`npm run build`（默认即可）
5. **Output Directory**：留空（Next.js 默认）
6. 点击 **Environment Variables**，添加与本地一致的环境变量，例如：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`、`RESEND_FROM`、`EMAIL_TO`
   - `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY` 等
7. 点击 **Deploy**，等待构建完成

## 三、部署失败：「Vulnerable version of Next.js」(CVE-2025-66478)

若出现 **Vulnerable version of Next.js detected, please update immediately**：

- 项目已把 `next` 固定为 **15.5.7**（Vercel 要求的安全版本），并在 `package.json` 中加了 `overrides` 确保安装到该版本。
- **必须把 `package.json` 和 `package-lock.json` 一起提交并推送**，否则 Vercel 可能仍装到旧版本：
  ```bash
  git add package.json package-lock.json
  git commit -m "fix: upgrade Next.js to 15.5.7 for CVE-2025-66478"
  git push origin main
  ```
- 推送后在 Vercel 会自动重新部署；或到项目里点 **Redeploy**。

## 四、后续更新

代码推送到对应分支后，Vercel 会自动重新部署；环境变量在 **Project → Settings → Environment Variables** 中修改。
