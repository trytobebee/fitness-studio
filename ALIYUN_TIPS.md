# 阿里云 ECS 部署最佳实践

## 创建 ECS 实例时的关键选择

### 1. 地域和可用区
- **地域**：选择靠近你用户的地区（如 cn-beijing、cn-shanghai）
- **可用区**：任选一个（会自动选择最优）

### 2. 实例规格选择

| 场景 | CPU | 内存 | 存储 | 带宽 | 月费用 |
|------|-----|------|------|------|--------|
| 开发/测试 | 1 核 | 1 GB | 20 GB SSD | 1 Mbps | ¥100-150 |
| 小型生产 | 2 核 | 2 GB | 40 GB SSD | 2-3 Mbps | ¥200-300 |
| 中型生产 | 2 核 | 4 GB | 50 GB SSD | 3-5 Mbps | ¥350-450 |
| 大型生产 | 4 核 | 8 GB | 100 GB SSD | 5-10 Mbps | ¥800-1200 |

**推荐选择：2 核 2GB 内存**（最好的成本效益）

### 3. 存储选择
- **选择 SSD 云盘**（性能更好）
- 初始大小：40 GB
- 后续可以随时扩容

### 4. 网络配置
- **带宽选择**：
  - 初期选 2 Mbps（够用）
  - 如果用户多，后续可升级到 5-10 Mbps
  - 也可选择"按流量计费"（更经济，但可能较贵）

- **安全组配置**（很重要！）
  ```
  入站规则：
  - 80 (HTTP)：0.0.0.0/0
  - 443 (HTTPS)：0.0.0.0/0
  - 22 (SSH)：你的 IP 或 0.0.0.0/0（不安全）

  出站规则：
  - 全部允许
  ```

### 5. 操作系统
- **选择**：Ubuntu 24.04 LTS
- **镜像来源**：官方镜像
- **不需要**：买额外的软件

### 6. 购买时长
- 推荐：**1 年** 或 **3 年**（折扣力度大）
- 避免：按小时计费（贵得多）

---

## 购买后的初始配置

### 1. SSH 连接
```bash
# 使用密钥对登录（推荐）
ssh -i ~/key.pem ubuntu@你的实例IP

# 或密码登录
ssh ubuntu@你的实例IP
```

### 2. 初始系统设置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基本工具
sudo apt install -y curl wget git build-essential

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install -y docker-compose

# 验证安装
docker --version
docker-compose --version

# 配置 Docker 权限（避免每次都 sudo）
sudo usermod -aG docker ubuntu
# 需要重新登录才能生效
exit
```

### 3. 时区设置
```bash
# 改为中国时区
sudo timedatectl set-timezone Asia/Shanghai

# 验证
timedatectl
```

### 4. 防火墙配置（如果用系统防火墙）
```bash
# Ubuntu 24.04 默认未启用 ufw，如果启用了：
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
```

---

## 优化阿里云 ECS 上的应用性能

### 1. 内存优化

如果服务器只有 1-2GB 内存，启用 swap：

```bash
# 创建 2GB swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. 文件描述符限制

提高并发连接数：

```bash
# 编辑 /etc/security/limits.conf
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf

# 重新登录生效
exit
```

### 3. TCP 优化

```bash
# 编辑 /etc/sysctl.conf
sudo bash << 'EOF'
cat >> /etc/sysctl.conf << 'SYSCTL'
# TCP 连接优化
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
SYSCTL
sysctl -p
EOF
```

---

## 阿里云特定的管理

### 1. ECS 控制台常用操作

**监控流量和资源**
- 在阿里云控制台 → ECS → 实例详情 → 监控
- 可以看 CPU、内存、网络使用情况
- 如果资源不足，可以升级实例规格

**管理 IP 地址**
- 如果需要固定 IP，申请"弹性公网 IP"
- 域名 DNS 解析指向这个 IP

**快照和备份**
- 定期创建快照（类似备份）
- 遇到问题可以快速恢复

### 2. 成本优化

**降低费用的方法**
```
1. 选择"按量付费"后长期运行：自动参与折扣
2. 在阿里云购买"资源包"：便宜 20-30%
3. 如果有多个应用，合并到一台更大的服务器
4. 非高峰期可考虑"竞价实例"（便宜 70%，但可能被收回）
```

### 3. 安全加固

```bash
# 禁用 root 登录
sudo sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config

# 修改 SSH 端口（可选，增加安全性）
sudo sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config

# 只允许密钥登录（禁用密码）
sudo sed -i 's/^#PubkeyAuthentication/PubkeyAuthentication/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# 重启 SSH 服务
sudo systemctl restart sshd
```

---

## Docker 部署时的注意事项

### 1. 存储路径
Docker 容器数据默认存储在 `/var/lib/docker`，如果有多个容器，磁盘可能满。

**改用数据盘**（如果有额外的数据盘）
```bash
# 查看磁盘
lsblk

# 挂载数据盘到 /data
sudo mkfs.ext4 /dev/vdb  # vdb 是第二块盘
sudo mkdir -p /data
sudo mount /dev/vdb /data

# 配置 Docker 数据路径
sudo mkdir -p /data/docker
sudo vi /etc/docker/daemon.json
# 添加：
# {
#   "data-root": "/data/docker"
# }

sudo systemctl restart docker
```

### 2. 日志大小限制

确保已在 `docker-compose.yml` 中配置日志限制（默认已配置）

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 监控容器资源使用

```bash
# 实时监控
docker stats

# 清理日志
sudo sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log'
```

---

## 部署总结

**完整的部署顺序：**

1. ✅ 购买阿里云 ECS（2 核 2GB 推荐）
2. ✅ 初始系统配置（Docker、时区等）
3. ✅ 安全组配置（开放 80、443、22）
4. ✅ 克隆项目代码
5. ✅ 运行 Docker 部署
6. ✅ 配置域名 DNS
7. ✅ 配置 SSL 证书
8. ✅ 监控和维护

**预期成本**
- 2 核 2GB 内存：¥200-300/月
- 域名：¥50-100/年
- SSL 证书：免费（Let's Encrypt）
- **总计：约 ¥250-350/月**

---

有任何疑问或部署中遇到问题，告诉我！
