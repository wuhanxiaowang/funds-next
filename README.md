# 投资信号系统 - Next.js 全栈应用

基于 Next.js (App Router) + Supabase + 原生 CSS 开发的投资信号分析系统，支持新闻自动拉取、AI 分析、信号生成、定时任务和邮件提醒等功能。

## 功能特点

- **新闻自动拉取**：定时从 RSS 源拉取财经新闻
- **AI 分析**：使用大模型（如豆包、OpenAI）分析新闻，提取投资信号
- **信号生成**：根据分析结果生成投资信号，包含事件、资产类型、方向、强度等
- **定时任务**：支持定时拉取新闻和定时分析，可自定义时间间隔
- **邮件提醒**：当信号强度达到阈值时，自动发送邮件提醒
- **实时监控**：监控页面显示系统状态、新闻数量、信号数量等
- **数据可视化**：清晰的界面展示分析结果和历史记录

## 技术栈

- **前端**：Next.js 14 (App Router)、原生 CSS、玻璃拟态设计
- **后端**：Next.js API Routes（无需单独后端）
- **数据库**：Supabase（PostgreSQL）
- **AI 分析**：支持火山引擎豆包、OpenAI 等大模型
- **邮件服务**：支持 QQ 邮箱发送提醒
- **部署**：阿里云函数计算 FC（见 [ALIYUN_FC.md](./ALIYUN_FC.md)）

## 快速开始

### 1. 环境准备

1. **创建 Supabase 项目**：访问 [Supabase](https://supabase.com) 创建新项目
2. **建表**：在 Supabase 控制台 → SQL Editor 执行建表脚本（见下方）
3. **安装依赖**：
   ```bash
   npm install
   ```

### 2. 建表脚本

在 Supabase SQL Editor 执行以下脚本创建必要的表：

```sql
-- 新闻表
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT,
  published_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 信号表
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  news_id INTEGER REFERENCES news(id),
  event TEXT,
  asset_class TEXT,
  direction TEXT,
  probability INTEGER,
  period TEXT,
  logic TEXT,
  strength INTEGER,
  operation TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 提醒表
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  signal_id INTEGER REFERENCES signals(id),
  alert_type TEXT,
  status TEXT,
  email TEXT,
  email_status TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 规则表
CREATE TABLE IF NOT EXISTS rules (
  id SERIAL PRIMARY KEY,
  keywords TEXT,
  asset_class TEXT,
  operation TEXT,
  threshold INTEGER DEFAULT 70,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 环境变量配置

复制 `.env.local.example` 为 `.env.local`，填写以下变量：

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL（Settings → API） |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | Service role key（Settings → API，勿暴露到前端） |
| `VOLCENGINE_API_KEY` | 否 | 火山引擎 API Key（使用豆包模型时必填） |
| `VOLCENGINE_ENDPOINT_ID` | 否 | 火山引擎 Endpoint ID（使用豆包模型时必填） |
| `OPENAI_API_KEY` | 否 | OpenAI API Key（使用 OpenAI 模型时必填） |
| `ALERT_STRENGTH_THRESHOLD` | 否 | 提醒阈值，默认 70 |
| `EMAIL_USER` | 否 | QQ 邮箱账号（用于发送提醒） |
| `EMAIL_PASS` | 否 | QQ 邮箱授权码（用于发送提醒） |
| `EMAIL_TO` | 否 | 接收提醒的邮箱地址 |

### 4. 本地运行

```bash
npm run dev
```

浏览器打开 http://localhost:3000 即可访问系统。

### 5. 部署

部署到**阿里云函数计算 FC**（含前端与 API），详见 **[ALIYUN_FC.md](./ALIYUN_FC.md)**。

## 使用说明

### 1. 监控页面

- **系统状态**：显示服务状态、上次更新时间、下次执行时间
- **统计数据**：显示今日新闻、今日信号、有效信号、提醒次数
- **操作按钮**：拉取新闻、立即分析、启动/停止定时分析、启动/停止定时拉取

### 2. 分析页面

- **分析状态**：显示分析进度、当前步骤、状态消息
- **分析历史**：显示历史分析结果和信号
- **操作按钮**：开始分析、停止分析、重置状态

### 3. 信号页面

- **信号列表**：显示所有生成的投资信号
- **搜索功能**：可按事件、资产类型、操作等搜索信号

### 4. 提醒页面

- **提醒记录**：显示所有发送的提醒
- **过滤功能**：可按提醒类型过滤

### 5. 定时任务

- **定时拉取**：默认每 2 小时拉取一次新闻
- **定时分析**：默认每 2 小时分析一次新闻
- **下次执行时间**：在监控页面显示下次执行时间

## 项目结构

```
frontend-next/
├── app/
│   ├── api/            # API 路由
│   │   ├── news/       # 新闻相关 API
│   │   ├── analyze/    # 分析相关 API
│   │   ├── signals/    # 信号相关 API
│   │   ├── alerts/     # 提醒相关 API
│   │   └── rules/      # 规则相关 API
│   ├── monitor/        # 监控页面
│   ├── analyze/        # 分析页面
│   ├── signals/        # 信号页面
│   ├── alerts/         # 提醒页面
│   ├── rules/          # 规则页面
│   └── asset-classes/  # 资产类型页面
├── lib/
│   ├── supabase.js     # Supabase 配置
│   ├── api.js          # API 调用封装
│   ├── pipeline.js     # 分析 pipeline
│   ├── ai.js           # AI 分析
│   ├── cron-service.js # 定时任务服务
│   └── email.js        # 邮件发送
├── components/
│   └── Nav.jsx         # 导航组件
├── .env.local.example  # 环境变量示例
├── package.json        # 项目配置
└── README.md           # 项目说明
```

## 常见问题

### 1. 分析没有反应

- 检查 Supabase 配置是否正确
- 检查 AI 模型配置是否正确
- 查看浏览器开发者工具的网络请求和控制台日志
- 检查开发服务器日志

### 2. 邮件发送失败

- 检查 QQ 邮箱配置是否正确
- 确保已开启 QQ 邮箱 SMTP 服务并获取授权码
- 检查收件人邮箱地址是否正确

### 3. 定时任务不执行

- 检查定时任务服务是否启动
- 检查浏览器是否保持打开状态（本地开发时）
- 部署到服务器时，确保服务器持续运行

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！