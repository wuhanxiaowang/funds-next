# 腾讯云 CloudBase（云开发）Web 函数部署说明

## 一、核心优势

- **零配置**：自动识别 Next.js，无需改 `next.config.js`
- **控制台操作**：无需写脚本/打包，可直接上传项目目录
- **国内节点**：访问快，免费额度适合个人项目
- **Next.js + API 路由**：页面与 `/api/*` 均可正常运行

---

## 二、部署步骤（约 5 分钟）

### 1. 开通服务

1. 登录 [腾讯云](https://cloud.tencent.com/) → **云开发 CloudBase**
2. **新建环境**，计费方式选 **「按量付费」**（免费额度自动生效）

### 2. 创建 Web 函数

1. 进入环境 → **云函数** → **新建**
2. 选择 **「Web 函数」**
3. **代码上传**：选择 **「本地上传文件夹」**，选中本项目**根目录**（含 `package.json`、`app`、`next.config.js` 等）
4. **运行时**：选择 **Node.js 18** 或 **Node.js 20**
5. **启动命令**：一般无需填写，CloudBase 会自动识别 `package.json` 里的 `start`（`next start`）。若需指定端口，可在控制台「环境变量」中增加 `PORT=9000`，并在 **启动命令** 填：`npm run start:cloudbase`

### 3. 安装依赖并构建（重要）

Web 函数需要**先在本机构建**再上传，否则运行会报错：

在项目根目录执行：

```bash
npm install --registry https://registry.npmmirror.com
npm run build
```

上传时选择**已执行过上述命令后的项目根目录**（包含 `node_modules` 和 `.next`）。

### 4. 环境变量

在 CloudBase 控制台 → 该 Web 函数 → **配置** → **环境变量** 中添加与本地一致变量，例如：

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`、`RESEND_FROM`、`EMAIL_TO`
- `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY` 等

### 5. 部署与访问

1. 点击 **部署**，等待完成
2. 部署成功后生成**免费访问域名**（如 `xxx.service.tcloudbase.com`）
3. 浏览器访问该域名，即可使用 Next.js 页面和 API

---

## 三、若控制台要求固定端口

部分环境下 Web 函数要求进程监听 **9000**。已在 `package.json` 中增加脚本：

- **启动命令** 填：`npm run start:cloudbase`  
  会执行 `next start -p 9000 -H 0.0.0.0`，满足 CloudBase 要求。

---

## 四、后续更新

代码或依赖更新后，在本地重新执行 `npm install` 和 `npm run build`，再在控制台用「本地上传文件夹」重新上传并部署即可。

---

## 五、容器 / EKS 部署：接口报错「Supabase not initialized」

若通过 **Docker 镜像 + 腾讯云 EKS（或云托管）** 部署，容器内**没有** `.env.local`，所有环境变量必须在腾讯云控制台里配置，否则会出现：

- **获取审计日志失败: {"error":"Supabase not initialized"}**
- 其他接口也返回未初始化或 500

### 解决步骤

1. 打开腾讯云控制台 → 进入你部署 **fund-next** 的服务（如弹性容器 / 云托管 / 工作负载）。
2. 找到 **配置** / **环境变量** / **Workload 环境变量**。
3. 添加与本地 `.env.local` **完全一致**的变量，至少包含：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（Supabase Dashboard → Settings → API） |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key（同上，勿暴露到前端） |

4. 若用到分析、邮件、审计等，一并配置：
   - `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY`、`VOLCENGINE_API_KEY` 等
   - `RESEND_API_KEY`、`RESEND_FROM`、`EMAIL_TO`
   - `ALERT_STRENGTH_THRESHOLD`（可选）

5. 保存后**重新部署**或**重启**当前版本，使环境变量生效。

配置正确后，再访问审计、监控、分析等页面，接口即可正常返回。

---

## 六、接口 404（如「开始分析」无反应）

若控制台出现 **404 (Not Found)**，且请求地址是 `/api/analyze/run` 等：

1. **是否部署在子路径**  
   若访问地址类似 `https://域名/xxx/`（如 `https://xxx.com/fund-next/`），需配置 **子路径**，否则前端会请求根路径 `/api/...`，导致 404。
   - 在腾讯云该服务的 **环境变量** 中增加：`NEXT_PUBLIC_BASE_PATH=/fund-next`（把 `/fund-next` 换成你的实际子路径，不要末尾斜杠）。
   - **重新构建镜像并部署**（basePath 在构建时生效）。
   - 部署后访问 `https://域名/fund-next/`，再试「开始分析」。

2. **未部署在子路径**  
   若访问地址是 `https://域名/`（根路径），则不要设置 `NEXT_PUBLIC_BASE_PATH`。  
   若仍 404，在浏览器 **Network** 里看「开始分析」请求的完整 URL 和响应，确认请求是否到达当前服务、网关是否把 `/api/*` 转发到容器。
