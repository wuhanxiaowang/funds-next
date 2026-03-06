# 阿里云函数计算 FC 部署（完整 Next.js + API）

需要**同时使用前端页面和 `/api/*` 接口**时，请用 **函数计算 FC** 部署完整应用，不要用 ESA 静态导出。

## 本地开发（照常即可）

本地不需要任何 FC 相关配置，按平时习惯来：

- **开发**：`npm run dev`（默认 3000 端口）
- **本地看构建效果**：`npm run build` → `npm start`

只有在**部署到 FC** 时才需要 `s deploy` 和监听 9000 端口（FC 已通过 `scripts/fc-server.js` 和 `start:fc` 处理）。

---

## 一、前置条件

- 已安装 [Node.js 18+](https://nodejs.org/)
- 已开通 [阿里云函数计算](https://fcnext.console.aliyun.com/)
- 已安装 [Serverless Devs](https://docs.serverless-devs.com/)：`npm i -g @serverless-devs/s`
- 已配置阿里云账号：在终端执行 `s config add`，选择 Alibaba Cloud，填 AccessKey ID / AccessKey Secret

## 二、部署步骤

### 1. 构建

在项目根目录执行：

```bash
npm install --registry https://registry.npmmirror.com
npm run build
```

（不要用 `npm run build:esa`，那是给 ESA 静态导出的。）

### 2. 部署到 FC

在项目根目录执行：

```bash
s deploy
```

首次会创建服务与函数；之后再次执行会更新。部署成功后会给出 **HTTP 触发器地址**（或自定义域名），在浏览器中打开即可访问整站（含页面和 `/api/*`）。

### 3. 环境变量（API 所需）

在 [函数计算控制台](https://fcnext.console.aliyun.com/) → 选择函数 **funds-next** → **配置** → **环境变量** 中配置，例如：

- `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`、`RESEND_FROM`、`EMAIL_TO`
- `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY` 等

配置后需**发布新版本**或重新部署才会生效。

## 三、自定义域名（可选）

在函数计算控制台为函数配置 **自定义域名**，并绑定到该函数的 HTTP 触发器，即可用自有域名访问（并避免默认域名下载附件等问题）。

## 四、与 ESA 的区别

| 方式           | 前端页面 | API 接口 | 适用场景           |
|----------------|----------|-----------|--------------------|
| **ESA 静态**   | ✅       | ❌        | 纯静态站、不需要接口 |
| **FC 部署本应用** | ✅       | ✅        | 需要接口时用 FC     |

若当前已在 ESA 使用 `build:esa` 静态导出，要启用 API 时请改为按本文用 FC 部署完整应用。
