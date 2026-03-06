# Cloudflare Pages 部署说明

## 构建配置（必填）

在 Cloudflare 控制台：**Workers & Pages** → 选择项目 **funds-next** → **设置** → **构建与部署**：

| 配置项 | 值 |
|--------|-----|
| **构建命令** | `npx @cloudflare/next-on-pages@1` |
| **构建输出目录** | `.vercel/output/static` |
| **根目录** | 留空（默认仓库根目录） |

## 重要：不要设置「部署命令」

若出现错误：

```text
Executing user deploy command: /
/bin/sh: 1: :/ Permission denied
Failed: error occurred while running deploy command
```

说明 **「部署命令」被错误地设成了 `/`**。请按下面步骤修改：

1. 打开 **Workers & Pages** → **funds-next** → **设置** → **构建与部署**。
2. 找到 **「部署命令」**（或 Deploy command、Post-build command 等类似名称）。
3. **清空该字段**，不要填写 `/` 或任何内容，保存后重新部署。

Cloudflare Pages 会在构建完成后自动上传 `.vercel/output/static`，无需单独配置部署命令。

## 环境变量

在 **设置** → **环境变量** 中配置：

- `RESEND_API_KEY`、`RESEND_FROM`、`EMAIL_TO`（邮件提醒）
- Supabase：`NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
- AI：`OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY` 等
