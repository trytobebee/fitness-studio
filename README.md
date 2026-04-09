# Fitness Studio 管理系统

一个为健身门店设计的完整管理系统，支持多门店、教练、客户、排课和预订管理。

## 功能特性

### 用户角色
- **总部管理员**：查看全系统统计、管理所有门店
- **门店经理**：排课、管理教练和客户、处理预订
- **教练**：查看课表、管理学员、签到
- **客户**：约课、查看课表、管理课程包

### 核心功能
- 🏪 多门店管理（门店信息、位置）
- 👨‍🏫 教练管理（跨门店分配、距离计算）
- 👥 客户管理（会员信息、课程包）
- 📅 课程排课（智能冲突检测、教练距离计算）
- 💳 课程包和预订（原子事务、信用额度管理）
- 📊 数据统计和报表

## 技术栈

- **前端**：Next.js 16 + React 19 + Tailwind CSS
- **后端**：Next.js API Routes
- **数据库**：SQLite（开发）/ PostgreSQL（生产）
- **ORM**：Prisma 7
- **认证**：JWT + HttpOnly Cookies
- **UI 组件**：自定义 + Lucide Icons

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma db push

# 加载测试数据
npx prisma db seed

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000/login`

### 测试账户

| 角色 | 手机 | 密码 |
|------|------|------|
| 总部管理员 | 13800000001 | admin123 |
| 门店经理 | 13800000010 | manager123 |
| 教练 | 13800000020 | coach123 |
| 客户 | 13800000030 | client123 |

## 部署

### Ubuntu 服务器部署

详见 `DEPLOY_UBUNTU.md`

### 云服务部署

- Vercel + PostgreSQL：见 `DEPLOYMENT.md`

## 环境变量

```
DATABASE_URL="file:./dev.db"           # SQLite（开发）
JWT_SECRET="your-secret-key"           # JWT 密钥
NODE_ENV="development"                 # 环境
```

## 快速清单

- [ ] 本地开发环境运行正常
- [ ] 测试账户可以登录
- [ ] 代码推送到 GitHub
- [ ] Ubuntu 服务器部署完成
- [ ] 域名指向服务器
- [ ] HTTPS 配置完成
- [ ] 用户可以访问应用

祝贺！系统已准备好交付用户使用。
