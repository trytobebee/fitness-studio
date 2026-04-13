# 故障排除指南

---

## 一、开发环境问题

### 问题：开发服务器无法启动，页面显示 Internal Server Error

**症状**
- 访问 `http://localhost:3000` 显示 "Internal Server Error"
- 日志出现 `TurbopackInternalError: Failed to restore task data`

**原因**：Turbopack 实验性编译器缓存损坏

**解决**：删除 `next.config.ts` 中的 `turbopack: {}`，然后清理缓存：
```bash
pkill -9 -f "node"
rm -rf .next .turbo node_modules/.cache
npm run dev
```

---

### 问题：用 IP 地址访问开发服务器被拒绝

**解决**：在 `next.config.ts` 的 `allowedDevOrigins` 中加入对应 IP：
```typescript
allowedDevOrigins: ['10.0.0.9', '192.168.0.100', 'localhost', '127.0.0.1'],
```

---

## 二、Docker 构建问题

### 问题：构建上下文过大（2GB+），发送很慢

**原因**：没有 `.dockerignore`，把 `node_modules`、`.next`、`*.tar` 都打包进去了

**解决**：项目根目录创建 `.dockerignore`：
```
node_modules
.next
.git
*.tar
*.md
.env
.env.local
prisma/dev.db
prisma/*.db
prisma/migrations
```

---

### 问题：构建时 I/O error（input/output error）

**原因**：Colima 虚拟机磁盘空间不足

**解决**：
```bash
colima stop
colima start
docker system prune -af   # 清理所有未使用的镜像和缓存
```

**注意**：`docker system prune -af` 会删除所有未运行容器使用的镜像，包括构建缓存层。删除后下次构建会重新下载基础镜像，时间较长。只在磁盘真正告急时执行。

---

### 问题：npm ci 网络中断（ECONNRESET）

**原因**：网络不稳定，下载包时断连

**解决**：直接重试构建，缓存层会复用，只重跑失败的步骤：
```bash
docker build --platform linux/amd64 -t fitness-studio:latest .
```

---

### 问题：跨架构构建（Mac ARM → Linux amd64）

**说明**：在 M 系列 Mac 上为阿里云（x86）构建镜像，必须加 `--platform` 参数：
```bash
docker build --platform linux/amd64 -t fitness-studio:latest .
```
构建过程会有 `[Warning] platform does not match` 提示，属于正常现象，不影响结果。

---

## 三、Prisma 7.x 兼容性问题

### 问题：`prisma db push` 报错 "datasource.url property is required"

**原因**：Prisma 7.x 破坏性变更——数据库连接 URL 不再写在 `schema.prisma` 的 `datasource` 块里，必须放在项目根目录的 `prisma.config.ts` 中。

**错误写法（Prisma 7.x 之前）**：
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // ❌ 7.x 不再支持
}
```

**正确写法**：
```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  // 不写 url
}
```
```typescript
// prisma.config.ts（项目根目录）
import { defineConfig } from "prisma/config"
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env["DATABASE_URL"] },
})
```

**Dockerfile 中必须把 `prisma.config.ts` 复制到运行阶段**：
```dockerfile
COPY prisma ./prisma
COPY prisma.config.ts ./   # ← 不能漏
```

---

### 问题：`prisma db push --skip-generate` 报错

**原因**：Prisma 7.x 移除了 `--skip-generate` 参数

**解决**：`package.json` 的 start 脚本去掉该参数：
```json
"start": "prisma db push && next start -H 0.0.0.0 -p 3000"
```

---

### 问题：Dockerfile 中 `npm ci` 时 Prisma postinstall 失败

**原因**：`npm ci` 运行时 Prisma 会执行 postinstall（`prisma generate`），但 `DATABASE_URL` 尚未设置

**解决**：在 `npm ci` 之前设置 `ENV DATABASE_URL`：
```dockerfile
ENV DATABASE_URL=file:/app/data/prod.db
RUN npm ci --omit=dev
```

---

## 四、部署流程问题

### 问题：容器启动后登录报"手机号或密码错误"

**原因**：数据库是空的。`prisma db push` 只建表结构，不填数据。

**解决**：本地生成 demo 数据库，上传到服务器：
```bash
# 本地生成
DATABASE_URL=file:./prisma/demo.db npx prisma db push
DATABASE_URL=file:./prisma/demo.db npx tsx ./prisma/seed.ts

# 上传（在本地执行）
scp prisma/demo.db user@服务器IP:~/demo.db

# 在服务器上，启动容器前放入 volume
sudo cp ~/demo.db /var/lib/docker/volumes/fitness-studio-data/_data/prod.db
docker compose up -d
```

**注意**：`demo.db` 不要提交到 git（已加入 `.gitignore`）。

---

### 问题：登录 API 返回 200，但页面无反应，跳转后立刻回到登录页

**原因**：Cookie 设置了 `Secure` 标志，但服务器是 HTTP 而非 HTTPS。浏览器拒绝在 HTTP 下存储带 `Secure` 标志的 cookie，导致跳转后中间件读不到登录状态，再次跳回登录页。

**解决**：`app/api/auth/login/route.ts` 中改为根据实际请求协议判断：
```typescript
// ❌ 错误：生产模式不一定是 HTTPS
secure: process.env.NODE_ENV === 'production'

// ✅ 正确：根据实际请求是否 HTTPS 决定
const isHttps = request.headers.get('x-forwarded-proto') === 'https'
  || request.nextUrl.protocol === 'https:'
response.cookies.set('auth-token', token, {
  secure: isHttps,
  ...
})
```

---

### 问题：大文件（*.tar）被误提交到 git，push 被 GitHub 拒绝

**原因**：Docker 镜像 tar 文件（800MB+）被 `git add` 进去了

**解决**：
```bash
# 从 git 历史中彻底删除
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch fitness-studio.tar' \
  --prune-empty --tag-name-filter cat -- --all
git push --force
```

**预防**：`.gitignore` 中加入 `*.tar`

---

## 五、标准部署流程（阿里云）

```bash
# 1. 本地构建（Mac ARM 构建 Linux amd64）
docker build --platform linux/amd64 -t fitness-studio:latest .

# 2. 打包（gzip 压缩，约 300MB）
docker save fitness-studio:latest | gzip > fitness-studio.tar.gz

# 3. 上传镜像和 demo 数据库
scp fitness-studio.tar.gz user@服务器IP:~/
scp prisma/demo.db user@服务器IP:~/demo.db   # 如需 demo 数据

# 4. SSH 进服务器
docker load < fitness-studio.tar.gz
sudo cp ~/demo.db /var/lib/docker/volumes/fitness-studio-data/_data/prod.db  # 如需 demo 数据
docker compose down
docker compose up -d

# 5. 验证
docker logs fitness-studio -f
```

---

记录日期：2026-04-11
最后更新：2026-04-14
