'use client'

import { useEffect, useState } from 'react'

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)

          // 检查是否有待安装的更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  // 通知用户有新版本可用
                  const reload = confirm('应用已更新，是否立即重新加载？')
                  if (reload) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err)
        })
    }

    // 监听 beforeinstallprompt 事件（Android）
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 监听 appinstalled 事件
    window.addEventListener('appinstalled', () => {
      console.log('PWA 已安装')
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`用户响应: ${outcome}`)
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  // 只在 Android Chrome 中自动显示提示
  // iOS 用户需要手动操作，所以我们在应用中提供引导
  if (!showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">安装应用</h3>
            <p className="text-sm text-gray-600">安装到桌面，随时随地使用</p>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            安装
          </button>
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
