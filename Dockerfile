# 腾讯云等容器构建用 - Next.js 镜像
FROM node:18-alpine AS base

WORKDIR /app

# 依赖
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --registry https://registry.npmmirror.com

# 构建
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npm run build

# 生产运行
FROM base AS runner
ENV NODE_ENV=production
# EKS 健康检查默认探 80 端口，与 Next 监听端口一致
ENV PORT=80
EXPOSE 80

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

CMD ["node", "server.js"]
