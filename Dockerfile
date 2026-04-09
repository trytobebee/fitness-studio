# 多阶段构建：先构建，再运行
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# ===== 运行阶段 =====
FROM node:20-alpine

WORKDIR /app

# 只复制必要的文件
COPY package*.json ./
COPY prisma ./prisma

# 仅安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从 builder 阶段复制构建产物
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# 创建数据库目录
RUN mkdir -p /app/data

# 环境变量
ENV NODE_ENV=production \
    DATABASE_URL=file:/app/data/prod.db

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
