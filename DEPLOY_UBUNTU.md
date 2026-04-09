# 在 Ubuntu 24.04 服务器上部署指南

## 第一步：连接到服务器

```bash
ssh root@你的服务器IP
# 或者用你的用户名
ssh ubuntu@你的服务器IP
```

## 第二步：安装 Node.js 和必要工具

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 安装其他必要工具
sudo apt install -y git curl wget build-essential
```

## 第三步：下载应用代码

### 选项 A：从 GitHub 克隆（推荐）

```bash
cd /opt
sudo git clone https://github.com/你的用户名/fitness-studio.git
sudo chown -R $USER:$USER fitness-studio
cd fitness-studio
```

### 选项 B：从本地上传

在你的本地机器：
```bash
# 打包代码
zip -r fitness-studio.zip fitness-studio -x "node_modules/*" ".next/*" "*.db"

# 上传到服务器
scp fitness-studio.zip ubuntu@你的服务器IP:/tmp/

# 服务器上解压
ssh ubuntu@你的服务器IP
cd /opt
unzip /tmp/fitness-studio.zip
cd fitness-studio
```

## 第四步：安装依赖和初始化数据库

```bash
# 安装 npm 依赖
npm install

# 初始化数据库（创建表）
npx prisma db push

# 加载测试数据
npx prisma db seed

# 构建应用
npm run build
```

## 第五步：安装 PM2（应用进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start npm --name "fitness-studio" -- start

# 保存 PM2 配置，开机自动启动
pm2 startup
pm2 save

# 验证应用是否运行
pm2 status
pm2 logs fitness-studio
```

## 第六步：安装和配置 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/fitness-studio
```

粘贴以下内容（替换 `your-domain.com`）：

```nginx
upstream fitness_studio {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 20M;

    location / {
        proxy_pass http://fitness_studio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/fitness-studio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 第七步：配置域名和 DNS

1. 在你的域名注册商（阿里云等）的 DNS 管理中：
   - 添加 A 记录
   - 主机名：`fitness` 或 `@`（取决于要配置的子域）
   - 记录值：服务器的公网 IP 地址

2. 等待 DNS 生效（通常 5-30 分钟）

```bash
# 验证 DNS 是否生效
nslookup your-domain.com
```

## 第八步：配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取免费 SSL 证书（会自动更新 Nginx 配置）
sudo certbot --nginx -d your-domain.com

# 验证自动续期
sudo systemctl enable certbot.timer
```

完成后，访问 `https://your-domain.com` 应该能看到登录页面！

## 日常管理

```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs fitness-studio

# 重启应用
pm2 restart fitness-studio

# 更新应用代码
cd /opt/fitness-studio
git pull
npm install
npm run build
pm2 restart fitness-studio

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 常见问题

### Q: 应用启动失败
```bash
pm2 logs fitness-studio  # 查看错误日志
pm2 restart fitness-studio  # 重启
```

### Q: 域名访问显示 502 Bad Gateway
- 检查应用是否运行：`pm2 status`
- 检查 Nginx 配置：`sudo nginx -t`
- 检查防火墙是否开放 80/443 端口

### Q: 如何备份数据库
```bash
# SQLite 数据库文件默认在这里
ls -lh /opt/fitness-studio/dev.db

# 备份
cp /opt/fitness-studio/dev.db /opt/fitness-studio/dev.db.backup
```

### Q: 更新应用代码后不显示新版本
```bash
# 清理 Next.js 缓存
rm -rf /opt/fitness-studio/.next
npm run build
pm2 restart fitness-studio
```

## 部署检查清单

- [ ] 服务器 SSH 连接成功
- [ ] Node.js 和 npm 已安装
- [ ] 代码已下载到 `/opt/fitness-studio`
- [ ] 依赖已安装：`npm install`
- [ ] 数据库已初始化：`npx prisma db push`
- [ ] 测试数据已加载：`npx prisma db seed`
- [ ] 应用已构建：`npm run build`
- [ ] PM2 已启动应用
- [ ] Nginx 已配置和启动
- [ ] 域名 DNS 已配置
- [ ] 可以访问 `https://your-domain.com`
- [ ] 测试账户可以登录

## 测试账户

部署完成后，用以下账户测试：

| 角色 | 手机 | 密码 | 用途 |
|------|------|------|------|
| 总部管理员 | 13800000001 | admin123 | 查看所有统计、管理门店 |
| 门店经理 | 13800000010 | manager123 | 排课、管理学员和教练 |
| 教练 | 13800000020 | coach123 | 查看课表、学员记录 |
| 学员 | 13800000030 | client123 | 约课、查看课表 |

## 祝贺！

应用已成功部署到你的服务器。现在可以分享给潜在用户使用了！
