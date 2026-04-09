# Vercel 部署指南

## 前置准备

### 1. 创建 PostgreSQL 数据库（使用 Supabase）

1. 访问 https://supabase.com 并注册账户
2. 创建一个新项目，选择 PostgreSQL
3. 项目创建完成后，复制以下信息：
   - 在 "Settings > Database" 中，找到 "Connection string"
   - 复制 "URI" 格式的连接字符串（postgresql://...）

### 2. 本地开发环境配置

#### 选项 A：使用本地 PostgreSQL（推荐用于测试部署配置）

```bash
# macOS 使用 Homebrew
brew install postgresql@15
brew services start postgresql@15

# 创建本地数据库
createdb fitness_studio_dev
```

更新 `.env.local`：
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/fitness_studio_dev"
JWT_SECRET="fitness-studio-super-secret-key-2024-minimum-32-chars"
```

#### 选项 B：继续使用 SQLite（如果只需云端部署）

保持 `DATABASE_URL="file:./dev.db"` 不变。本地开发会继续使用 SQLite，但 Vercel 部署时需要 PostgreSQL。

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行迁移（如果选择了选项 A）
npx prisma migrate deploy

# 或者直接推送 schema（开发模式）
npx prisma db push

# 运行 seed 脚本初始化测试数据
npx prisma db seed
```

### 4. 本地验证

```bash
npm run dev
# 访问 http://localhost:3000/login
# 使用测试账户登录验证功能
```

## Vercel 部署

### 1. 连接 GitHub 仓库

1. 推送你的代码到 GitHub
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <你的GitHub仓库地址>
   git push -u origin main
   ```

2. 访问 https://vercel.com 并用 GitHub 账户登录
3. 点击 "New Project" 选择你的 GitHub 仓库
4. 选择 "Next.js" 框架

### 2. 配置环境变量

在 Vercel 部署页面，进入 "Environment Variables" 添加：

```
DATABASE_URL=postgresql://user:password@host:5432/database_name
JWT_SECRET=fitness-studio-super-secret-key-2024-minimum-32-chars
NODE_ENV=production
```

其中 `DATABASE_URL` 使用你从 Supabase 复制的连接字符串。

### 3. 运行部署前脚本

在 Vercel 项目设置中，设置 "Build Command"：

```
npx prisma generate && npx prisma migrate deploy && next build
```

或在根目录创建 `vercel.json`：

```json
{
  "buildCommand": "npx prisma generate && npx prisma db push --skip-generate && next build",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### 4. 数据库初始化

部署后需要初始化数据库和种子数据。在你的本地或使用 Supabase 的 SQL Editor：

```bash
# 在有 Vercel 环境变量访问的机器上运行
npx prisma migrate deploy
npx prisma db seed
```

或通过 Supabase 的 SQL 编辑器直接运行 seed 脚本。

### 5. 验证部署

部署完成后：
1. 访问你的 Vercel 应用 URL
2. 应该看到登录页面（不是 404）
3. 使用测试账户登录验证所有功能

## 常见问题

### Q: 部署后仍然是 404
- 检查 Vercel 的 Build Logs 是否有错误
- 确保 DATABASE_URL 环境变量已正确设置
- 确保数据库初始化和 migrations 已运行

### Q: 数据库连接错误
- 验证 DATABASE_URL 格式正确
- 确认 PostgreSQL 数据库已创建
- 检查防火墙是否允许连接

### Q: 如何在本地和生产环境切换？
- 本地：保持 `.env.local` 的 DATABASE_URL 为 SQLite 或本地 PostgreSQL
- 生产：Vercel 环境变量会自动使用 PostgreSQL 连接字符串

## 快速清单

- [ ] 创建 PostgreSQL 数据库（Supabase）
- [ ] 更新本地 `.env.local`（可选）
- [ ] 运行 `npx prisma db push` 初始化本地数据库
- [ ] 运行 `npx prisma db seed` 添加测试数据
- [ ] 本地验证 `npm run dev` 工作正常
- [ ] 推送到 GitHub
- [ ] 在 Vercel 创建项目
- [ ] 添加环境变量到 Vercel
- [ ] 配置部署前脚本
- [ ] 触发部署
- [ ] 验证部署后应用正常工作
