'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

type Client = {
  id: string
  name: string
  phone: string
  clientProfile: {
    id: string
    creditAccounts: { remainingCredits: number; isActive: boolean }[]
  } | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      const data = await res.json()
      setClients(data.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(search), 300)
    return () => clearTimeout(timer)
  }, [search, fetchClients])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="客户管理"
        action={
          <Link href="/manager/clients/new" className="text-indigo-600 text-sm font-medium">
            + 新增
          </Link>
        }
      />

      <div className="px-4 py-3 mb-nav">
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名或手机号"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState icon={Users} title="暂无客户" description="点击右上角新增客户" />
        ) : (
          <Card>
            <div className="divide-y divide-gray-50">
              {clients.map((client) => {
                const totalCredits = client.clientProfile?.creditAccounts
                  .filter(a => a.isActive)
                  .reduce((sum, a) => sum + a.remainingCredits, 0) ?? 0
                return (
                  <Link
                    key={client.id}
                    href={`/manager/clients/${client.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600">{client.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">{totalCredits}</p>
                        <p className="text-xs text-gray-400">课时</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/manager/clients/new"
        className="fixed right-4 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg active:bg-indigo-700 transition-colors z-40 w-14 h-14"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </div>
  )
}
