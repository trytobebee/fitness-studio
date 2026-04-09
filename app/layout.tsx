import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWAProvider } from '@/components/providers/PWAProvider'

export const metadata: Metadata = {
  title: '健身管理系统',
  description: '专业健身门店管理平台',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '健身系统',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        {/* iOS PWA meta 标签 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="健身系统" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />

        {/* Android 相关 */}
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* 其他 PWA 相关 */}
        <link rel="icon" type="image/png" href="/icons/icon-192.png" />
        <link rel="mask-icon" href="/icons/icon-512-maskable.png" color="#4f46e5" />
      </head>
      <body className="min-h-full">
        {children}
        <PWAProvider />
      </body>
    </html>
  )
}
