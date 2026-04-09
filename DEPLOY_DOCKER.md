# Docker 方式部署指南

如果你的服务器上已经用 Docker 部署其他服务，这个指南会帮助你用同样的方式部署 Fitness Studio。

## 阿里云服务器配置建议

### 最低配置（测试/小规模）
- CPU：1 核，内存：1 GB → 容器限制 `256M`
- 同时用户：< 50

### 推荐配置（生产环境）
- CPU：2 核，内存：2-4 GB → 容器限制 `512M`
- 同时用户：100-500

### 高性能配置
- CPU：4 核，内存：8 GB → 容器限制 `1G`
- 同时用户：1000+

**在 `docker-compose.yml` 中修改资源限制**（见"性能调优"章节）

## 前置条件

确保服务器上已安装：
- Docker
- Docker Compose

验证安装：
```bash
docker --version
docker-compose --version
```

## 部署步骤

### 1. 克隆代码到服务器

```bash
cd /opt
git clone https://github.com/你的用户名/fitness-studio.git
cd fitness-studio
```

### 2. 配置环境变量

创建 `.env.production` 文件（可选，如果要自定义 JWT_SECRET）：

```bash
cat > .env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=file:/app/data/prod.db
JWT_SECRET=你的自定义密钥-至少32个字符
EOF
```

如果不创建，会使用 docker-compose.yml 中的默认值。

### 3. 配置 Nginx（如果使用）

编辑 `nginx.conf`，将 `your-domain.com` 改为你的域名：

```bash
sed -i 's/your-domain.com/你的域名/g' nginx.conf
```

### 4. 初始化数据库

在第一次运行时，需要初始化数据库和加载测试数据：

```bash
# 构建镜像（第一次需要，之后可跳过）
docker-compose build

# 启动容器
docker-compose up -d

# 等待容器启动完成（约 30 秒）
sleep 30

# 初始化数据库（在容器内运行）
docker-compose exec fitness-studio npx prisma db push

# 加载测试数据
docker-compose exec fitness-studio npx prisma db seed

# 查看日志确认启动成功
docker-compose logs fitness-studio
```

### 5. 验证应用运行

```bash
# 检查容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f fitness-studio

# 访问应用（如果直接运行，不用 Nginx）
curl http://localhost:3000
```

如果使用 Nginx，验证反向代理：
```bash
curl http://localhost -H "Host: your-domain.com"
```

## 使用 Nginx + SSL

### 第一次启动（未配置 SSL）

```bash
# 只启动应用，不启动 Nginx
docker-compose up -d fitness-studio

# 等待容器启动
sleep 30
docker-compose exec fitness-studio npx prisma db push
docker-compose exec fitness-studio npx prisma db seed
```

### 配置 SSL 证书

#### 方式 A：使用 Let's Encrypt（推荐）

```bash
# 创建 SSL 目录
mkdir -p ssl

# 使用 Certbot 获取证书
sudo apt install -y certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/cert.pem ssl/key.pem
```

#### 方式 B：自签名证书（测试用）

```bash
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
  -subj "/CN=your-domain.com/O=Fitness Studio/C=CN"
```

### 启动完整的 Docker Compose（包含 Nginx）

```bash
# 启动所有服务
docker-compose up -d

# 检查所有容器运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 配置自动更新 SSL 证书

```bash
# 创建更新脚本
cat > /opt/fitness-studio/renew-cert.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/fitness-studio/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/fitness-studio/ssl/key.pem
cd /opt/fitness-studio
docker-compose restart nginx
EOF

chmod +x /opt/fitness-studio/renew-cert.sh

# 添加到 crontab（每月自动更新）
(crontab -l 2>/dev/null; echo "0 2 1 * * /opt/fitness-studio/renew-cert.sh") | crontab -
```

## 常用命令

```bash
cd /opt/fitness-studio

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f fitness-studio
docker-compose logs -f nginx

# 重启应用
docker-compose restart fitness-studio

# 重启所有服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 完全移除（慎用！）
docker-compose down

# 更新代码后重新部署
git pull
docker-compose build --no-cache
docker-compose up -d

# 进入容器执行命令
docker-compose exec fitness-studio npx prisma db push
docker-compose exec fitness-studio npm run build
```

## 数据库备份

```bash
# 备份数据库文件
docker cp fitness-studio:/app/data/prod.db ./backup-$(date +%Y%m%d).db

# 或使用 Docker volume 备份
docker run --rm -v fitness-studio_fitness-studio-data:/app/data \
  -v $(pwd):/backup busybox \
  cp /app/data/prod.db /backup/backup-$(date +%Y%m%d).db
```

## 更新数据库 schema

如果你修改了 `prisma/schema.prisma`：

```bash
# 在容器内运行迁移
docker-compose exec fitness-studio npx prisma db push

# 重启应用以应用改动
docker-compose restart fitness-studio
```

## 日志管理

Docker 会自动限制日志大小（最多 10MB，保留 3 个文件），这在 docker-compose.yml 中已配置。

查看日志：
```bash
# 实时日志
docker-compose logs -f fitness-studio

# 最后 100 行
docker-compose logs --tail=100 fitness-studio

# 特定时间范围（需要 Docker 20.10+）
docker-compose logs --since 2h fitness-studio
```

## 性能调优

### 1. 根据服务器配置调整资源限制

编辑 `docker-compose.yml` 中的 `deploy.resources`：

**1 核 1GB 内存（最低配置）**
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
    reservations:
      cpus: '0.25'
      memory: 128M
```

**2 核 2-4GB 内存（推荐配置）**
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

**4 核 8GB 内存（高性能）**
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
    reservations:
      cpus: '1'
      memory: 512M
```

### 2. 优化 Nginx 工作进程

编辑 `nginx.conf`：
```nginx
# 设置为 CPU 核数
worker_processes auto;  # 自动检测 CPU 核数

# 或手动设置
worker_processes 2;  # 2 核服务器
```

### 3. 优化数据库连接

编辑 `docker-compose.yml` 中的环境变量：

```yaml
environment:
  NODE_ENV: production
  DATABASE_URL: file:/app/data/prod.db
  # 添加 Prisma 连接池配置（适用于高并发）
  DATABASE_POOL_TIMEOUT: 10
```

### 4. 清理和维护

**定期清理未使用的镜像和容器**
```bash
# 清理悬空镜像
docker image prune -f

# 清理未使用的容器
docker container prune -f

# 完整清理（谨慎使用！）
docker system prune -a
```

**监控服务器资源**
```bash
# 实时查看 Docker 资源使用
docker stats

# 查看容器详细信息
docker-compose top fitness-studio

# 查看容器日志大小
du -sh /var/lib/docker/containers
```

## 故障排查

### 容器启动失败

```bash
# 查看详细错误日志
docker-compose logs fitness-studio

# 尝试前台运行（便于看到实时错误）
docker-compose up fitness-studio
```

### 502 Bad Gateway

```bash
# 检查应用是否在运行
docker-compose ps

# 检查应用日志
docker-compose logs fitness-studio

# 重启应用
docker-compose restart fitness-studio
```

### 数据库连接错误

```bash
# 检查数据库文件是否存在
docker-compose exec fitness-studio ls -lah /app/data/

# 重新初始化数据库
docker-compose exec fitness-studio npx prisma db push
docker-compose exec fitness-studio npx prisma db seed
```

## 与其他 Docker 服务共享网络

如果有其他 Docker 服务想连接到 Fitness Studio，可以在他们的 docker-compose.yml 中：

```yaml
services:
  your-service:
    networks:
      - fitness-network

networks:
  fitness-network:
    external: true
```

然后用 `http://fitness-studio:3000` 访问应用。

## 部署检查清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 代码已克隆到 `/opt/fitness-studio`
- [ ] 环境变量已配置（可选）
- [ ] Nginx 配置已更新为正确的域名（如使用）
- [ ] SSL 证书已配置（如使用 HTTPS）
- [ ] 数据库已初始化（`npx prisma db push`）
- [ ] 测试数据已加载（`npx prisma db seed`）
- [ ] 容器正常运行（`docker-compose ps`）
- [ ] 可以访问应用
- [ ] 测试账户可以登录

完成！你的 Fitness Studio 现在已通过 Docker 部署在你的服务器上了。
