'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.111 16.332a7 7 0 0 0 9.778 0M12 20h.01M12 16h.01M12 12h.01M12 8h.01M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">离线状态</h1>
        <p className="text-gray-600 mb-8">
          您当前处于离线状态，部分功能可能无法使用。请检查网络连接。
        </p>

        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              ✅ 好消息：您可以浏览之前访问过的内容
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700">
              ℹ️ 提示：无法进行新的预订或数据更新，请稍后重试
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          重新尝试连接
        </button>

        <p className="text-xs text-gray-500 mt-6">
          或返回之前访问的页面继续浏览
        </p>
      </div>
    </div>
  )
}
