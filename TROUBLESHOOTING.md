# 故障排除指南

## 问题：开发服务器无法启动，页面显示 Internal Server Error

### 症状
- 访问 `http://localhost:3000` 或任何 IP 地址显示 "Internal Server Error"
- 开发服务器日志充满以下错误：
  ```
  TurbopackInternalError: Failed to restore task data (corrupted database or bug)
  Unable to open static sorted file 00000024.sst
  ```
- 即使删除 `.next` 目录也无法解决

### 根本原因
**Next.js 15 的实验性 Turbopack 编译器的缓存文件损坏**

Turbopack 是 Next.js 15 引入的新编译器，在某些情况下（例如频繁的清理/重启）缓存文件会损坏，导致无法编译代码。

### 解决方案

#### 步骤 1：禁用 Turbopack
编辑 `next.config.ts`，删除或注释掉 `turbopack: {}` 配置：

**修改前：**
```typescript
const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  turbopack: {},  // ❌ 删除这一行
  allowedDevOrigins: ['...'],
};
```

**修改后：**
```typescript
const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  // turbopack 配置已移除，使用 webpack 编译器
  allowedDevOrigins: ['...'],
};
```

#### 步骤 2：彻底清理缓存
```bash
pkill -9 -f "node"              # 杀死所有 node 进程
rm -rf .next .turbo             # 删除编译缓存
rm -rf node_modules/.cache      # 删除 node_modules 缓存
```

#### 步骤 3：重新启动开发服务器
```bash
npm run dev
```

### 验证修复
- 访问 `http://localhost:3000` 应该能看到登录页面
- 不再有 Turbopack 相关的错误日志
- 手机和电脑都能正常访问

### 为什么这样做有效？
- **Turbopack** 是实验性功能，缓存机制不够稳定
- **Webpack** 是 Next.js 的传统编译器，已验证的稳定方案
- 移除 `turbopack: {}` 后，Next.js 会自动降级到 webpack
- 对生产部署无影响（Docker 镜像已经是预编译的）

### 何时应用此解决方案
- 开发服务器报 `TurbopackInternalError`
- 页面显示 "Internal Server Error"
- 日志中看到 "corrupted database" 或 SST 文件错误

### 相关文件
- `next.config.ts` - 项目配置文件
- `.next/` - 编译输出目录（需要删除以重置）

---

## 其他常见问题

### IP 地址访问被拒绝
如果用 IP 地址访问（例如 `http://10.0.0.9:3000`）出现问题，检查 `next.config.ts` 中的 `allowedDevOrigins` 是否包含该 IP：

```typescript
allowedDevOrigins: ['10.0.0.9', 'localhost', '127.0.0.1'],
```

### Safari 和 HttpOnly Cookie
Safari 对来自 IP 地址的 HttpOnly cookie 有安全限制。如果登录后无法保存 cookie：
- 在 Mac hosts 文件中添加本地域名映射
- 或直接用真实域名访问（在阿里云服务器上）

---

记录日期：2026-04-11
最后更新：2026-04-11
