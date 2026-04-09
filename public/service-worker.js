// Service Worker for Fitness Studio PWA
// 处理离线缓存和背景同步

const CACHE_NAME = 'fitness-studio-v1'
const RUNTIME_CACHE = 'fitness-studio-runtime-v1'

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell')
      return cache.addAll([
        '/',
        '/login',
        '/offline',
        '/manifest.json',
        '/globals.css',
      ]).catch((err) => {
        console.log('Cache addAll error:', err)
        // 不要因为缓存失败而阻止 SW 激活
        return Promise.resolve()
      })
    })
  )
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求和外部域名
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return
  }

  // 对 API 请求特殊处理：先网络，失败用缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 缓存成功的响应
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          // 网络失败，尝试使用缓存
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached
            }
            // 如果没有缓存，返回离线页面
            if (request.mode === 'navigate') {
              return caches.match('/offline')
            }
            return new Response('Offline', { status: 503 })
          })
        })
    )
    return
  }

  // 对静态资源：先缓存，无缓存才请求网络
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i) ||
    url.pathname.includes('/_next/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const cache = caches.open(CACHE_NAME)
              cache.then((c) => c.put(request, response.clone()))
            }
            return response
          })
        )
      })
    )
    return
  }

  // 对 HTML 页面：先网络，失败用缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          return (
            caches.match(request) || caches.match('/offline')
          )
        })
    )
    return
  }

  // 其他请求：默认网络优先
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === 'GET') {
          const cache = caches.open(RUNTIME_CACHE)
          cache.then((c) => c.put(request, response.clone()))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// 处理来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
