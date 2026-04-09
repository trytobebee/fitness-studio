'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Eye, EyeOff, Phone, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  MANAGER: '/manager',
  COACH: '/coach',
  CLIENT: '/client',
}

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) { setError('请输入手机号和密码'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '登录失败'); return }
      router.push(ROLE_HOME[data.data.role] ?? '/login')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* 顶部 Logo 区 */}
      <div className="text-center px-8 pt-8 pb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">健身管理系统</h1>
        <p className="text-indigo-200 text-sm">智慧健身 · 专业管理</p>
      </div>

      {/* 登录卡片 */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl px-6 pt-6 pb-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">欢迎登录</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 手机号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={11}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
            登录
          </Button>
        </form>

        {/* 测试账号 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-medium text-gray-500 mb-2">测试账号</p>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>超级管理员</span>
              <span className="font-mono">18800000000 / admin123</span>
            </div>
            <div className="flex justify-between">
              <span>门店管理员</span>
              <span className="font-mono">18811000001 / manager123</span>
            </div>
            <div className="flex justify-between">
              <span>教练</span>
              <span className="font-mono">18822000001 / coach123</span>
            </div>
            <div className="flex justify-between">
              <span>客户</span>
              <span className="font-mono">18833000001 / client123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
