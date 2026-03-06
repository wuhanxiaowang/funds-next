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
RUN npm run build

# 生产运行
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

CMD ["node", "server.js"]
