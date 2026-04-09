'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 rounded-2xl py-3.5 text-sm font-medium active:bg-red-50 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {loading ? '退出中...' : '退出登录'}
    </button>
  )
}
