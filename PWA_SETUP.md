# PWA (Progressive Web App) 配置指南

你的 Fitness Studio 现在已经升级为 PWA！这个文档说明如何完成 PWA 配置。

## 🚀 什么已经做好了？

✅ **Service Worker**：离线缓存和后台同步
✅ **manifest.json**：PWA 应用配置
✅ **PWA Meta 标签**：iOS 和 Android 支持
✅ **iOS 安装指南**：帮助 iOS 用户安装
✅ **Android 自动提示**：Chrome 自动弹窗
✅ **离线页面**：网络不可用时显示

## ❓ 需要你手动做的：生成应用图标

### 为什么需要图标？

- **192x192**：Android 主屏幕
- **512x512**：Android 启动画面、应用安装
- **180x180**：iOS 主屏幕
- **Maskable icons**：特殊形状支持（安卓 13+）

### 快速生成图标（推荐）

#### 方式 1：使用在线工具（5 分钟）

1. 访问 https://www.favicon-generator.org/ 或 https://realfavicongenerator.net/

2. 上传你的 logo 或设计（或使用以下简单的 SVG）

3. 选择生成 PWA 图标

4. 下载所有图标文件

#### 方式 2：使用简单 SVG（推荐用于测试）

创建 `/public/icons/icon-base.svg`：

```xml
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#4f46e5"/>
  <text x="256" y="280" font-size="200" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">FS</text>
</svg>
```

然后用在线工具生成各种尺寸。

#### 方式 3：使用 ImageMagick（需要安装）

```bash
# 安装 ImageMagick
brew install imagemagick  # macOS
# 或
sudo apt install imagemagick  # Ubuntu

# 从 SVG 生成各种尺寸
convert -background none icon-base.svg -resize 192x192 icon-192.png
convert -background none icon-base.svg -resize 512x512 icon-512.png
convert -background none icon-base.svg -resize 180x180 icon-180.png
```

### 放置图标文件

下载的图标文件需要放在 `/public/icons/` 目录下：

```
public/
└── icons/
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png          ← 必需
    ├── icon-384.png
    ├── icon-512.png          ← 必需
    ├── icon-180.png          ← iOS（必需）
    ├── icon-192-maskable.png
    ├── icon-512-maskable.png
    └── (其他可选文件)
```

**最低要求的三个文件：**
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-180.png` (180x180) 用于 iOS

## 🧪 测试 PWA

### 在本地测试

```bash
# 1. 构建应用
npm run build

# 2. 启动生产服务器
npm start

# 3. 用浏览器访问 http://localhost:3000
```

### Android Chrome 测试

1. 打开 `http://localhost:3000`
2. Chrome 应该在底部弹出"安装"提示
3. 点击"安装"
4. 验证应用安装到主屏幕
5. 点击应用图标，应该全屏打开

### iOS Safari 测试

1. 打开 `http://localhost:3000`
2. 点击分享按钮（下箭头）
3. 向下滑动，找到"添加到主屏幕"
4. 确认并添加
5. 从主屏幕点击应用图标打开

### 检查 Service Worker

**Chrome DevTools 中：**
1. 打开 DevTools (F12)
2. 进入 "Application" 标签
3. 左侧选择 "Service Workers"
4. 应该看到 `service-worker.js` 已注册和激活
5. 点击 "Offline" 复选框测试离线功能

## 📱 用户体验

### Android 用户
```
1. 打开应用网址
2. Chrome 自动弹出安装提示
3. 点击"安装"
4. 应用自动添加到主屏幕
5. 看起来和用起来就像原生 App
```

### iOS 用户
```
1. 打开应用网址
2. 点击分享按钮
3. 向下滑动，选择"添加到主屏幕"
4. 确认
5. 应用会出现在主屏幕
6. 个人资料页有"📱 安装应用"按钮帮助引导
```

## 🔧 高级配置

### 自定义启动画面

编辑 `public/manifest.json` 的 `screenshots` 字段：

```json
"screenshots": [
  {
    "src": "/screenshots/screenshot-1.png",
    "sizes": "540x720",
    "type": "image/png",
    "form_factor": "narrow"
  }
]
```

### 添加快捷方式

用户可以从应用图标长按访问快捷方式：

```json
"shortcuts": [
  {
    "name": "排课",
    "short_name": "排课",
    "description": "快速创建课程排课",
    "url": "/manager/schedule?utm_source=shortcut",
    "icons": [...]
  }
]
```

### 配置分享目标

允许其他应用通过"分享"功能发送内容到你的应用：

```json
"share_target": {
  "action": "/share",
  "method": "POST",
  "enctype": "application/x-www-form-urlencoded",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url"
  }
}
```

## 🐛 常见问题

### Q：Service Worker 注册失败？
**A：**
- 检查浏览器控制台是否有错误
- 确保 `public/service-worker.js` 存在
- 清除浏览器缓存和 Service Worker：DevTools → Application → Clear storage

### Q：图标不显示？
**A：**
- 确保图标文件在 `public/icons/` 目录
- 文件名要匹配 `manifest.json` 中的配置
- 清除浏览器缓存
- 重新启动开发服务器

### Q：iOS 上推送通知不工作？
**A：**
- iOS PWA 的推送通知支持有限
- 暂时无解，建议用邮件或 SMS 通知替代

### Q：如何更新 PWA？
**A：**
- 部署新版本到服务器
- Service Worker 会检测更新
- 用户下次打开时自动更新
- 可以显示"新版本可用"的提示

## 📦 部署到生产环境

### 1. 生成并上传图标

```bash
# 确保图标已放在 public/icons/
ls -la public/icons/
```

### 2. 构建应用

```bash
npm run build
```

### 3. 部署（Docker）

```bash
docker-compose build --no-cache
docker-compose up -d
```

### 4. 验证 PWA 工作正常

```bash
# 检查 manifest.json 是否可访问
curl https://your-domain.com/manifest.json

# 检查 service-worker.js 是否可访问
curl https://your-domain.com/service-worker.js
```

### 5. 测试安装

- 用 Android 手机打开应用，验证安装提示
- 用 iOS 手机打开应用，验证可以添加到主屏幕

## ✨ PWA 功能总结

| 功能 | 现状 |
|------|------|
| **离线浏览** | ✅ 完全支持 |
| **安装到主屏幕** | ✅ Android 自动，iOS 手动 |
| **全屏启动** | ✅ 支持 |
| **自动更新** | ✅ 后台检测并更新 |
| **推送通知** | ✅ Android 支持，iOS 有限 |
| **后台同步** | ✅ Android 支持 |
| **快捷方式** | ✅ 可配置 |
| **分享目标** | ✅ 可配置 |

## 🎉 完成！

你的应用现在是一个完整的 PWA！用户可以像使用原生 App 一样使用它，同时你保留了 Web App 的所有优势。

有问题？检查：
1. 浏览器控制台的错误信息
2. DevTools → Application → Service Workers
3. 清除缓存重试
4. 检查图标文件是否存在
