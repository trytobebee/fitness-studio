'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function IOSInstallGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const isIOS = /iPad|iPhone|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')

  if (!isIOS) {
    return null
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg"
      >
        📱 安装应用
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">安装 Fitness Studio</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              在 iOS 上安装应用很简单，只需 4 个步骤：
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">打开分享菜单</h3>
                  <p className="text-sm text-gray-600">点击 Safari 底部的 上箭头 (分享) 按钮</p>
                  <div className="mt-2 bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500">
                      📍 位置：Safari 底部中间，看起来像这样 ⬆️
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">向下滑动菜单</h3>
                  <p className="text-sm text-gray-600">
                    在分享菜单中向下滑动，找到"添加到主屏幕"选项
                  </p>
                  <div className="mt-2 bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500">
                      💡 如果找不到，可能在"更多"里面
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">点击"添加到主屏幕"</h3>
                  <p className="text-sm text-gray-600">
                    选择"添加到主屏幕"选项
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">确认并完成</h3>
                  <p className="text-sm text-gray-600">
                    确认应用名称（默认是"Fitness Studio"），点击"添加"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 特性介绍 */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">安装后可以享受：</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-semibold">✓</span>
                <span className="text-gray-600">全屏显示，像真正的 App</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-semibold">✓</span>
                <span className="text-gray-600">快速启动，桌面一键打开</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-semibold">✓</span>
                <span className="text-gray-600">自动更新，永远使用最新版本</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-semibold">✓</span>
                <span className="text-gray-600">离线使用，没有网络也能浏览</span>
              </li>
            </ul>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            我已了解，关闭
          </button>
        </div>
      </div>
    </div>
  )
}
