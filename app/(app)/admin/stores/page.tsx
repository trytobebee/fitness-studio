'use client'
import { useState, useEffect, useCallback } from 'react'
import { Building2, MapPin, Phone, Trash2, Pencil, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

type Store = {
  id: string; name: string; address: string; phone: string | null
  latitude: number | null; longitude: number | null; isActive: boolean
  managers: { name: string; phone: string }[]
  _count: { scheduledClasses: number }
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '', latitude: '', longitude: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores(data.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  function openNew() {
    setEditing(null)
    setForm({ name: '', address: '', phone: '', latitude: '', longitude: '' })
    setError('')
    setDialogOpen(true)
  }

  function openEdit(store: Store) {
    setEditing(store)
    setForm({
      name: store.name,
      address: store.address,
      phone: store.phone || '',
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
    })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.address) {
      setError('门店名称和地址为必填项')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name,
        address: form.address,
        phone: form.phone || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }
      const url = editing ? `/api/stores/${editing.id}` : '/api/stores'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || '保存失败')
        return
      }
      setDialogOpen(false)
      fetch_()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(storeId: string) {
    if (deleting !== storeId) {
      setDeleting(storeId)
      return
    }
    try {
      await fetch(`/api/stores/${storeId}`, { method: 'DELETE' })
      fetch_()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="门店管理"
        action={
          <button onClick={openNew} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> 新增
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 mb-nav">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stores.length === 0 ? (
          <EmptyState icon={Building2} title="暂无门店" action={<Button onClick={openNew}>新增门店</Button>} />
        ) : (
          stores.map((store) => (
            <Card key={store.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{store.name}</h3>
                      <Badge variant={store.isActive ? 'success' : 'danger'}>
                        {store.isActive ? '营业中' : '已关闭'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(store)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleting === store.id ? 'bg-red-50 text-red-500' : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{store.address}</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xs text-gray-400">今日 {store._count.scheduledClasses} 节课</p>
                  {deleting === store.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDeleting(null)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleDelete(store.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        确认删除
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? '编辑门店' : '新增门店'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">门店名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="如：朝阳店"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">地址 *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="门店地址"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">电话</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="门店电话"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">纬度</label>
              <input
                type="number"
                step="0.0001"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                placeholder="39.9299"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">经度</label>
              <input
                type="number"
                step="0.0001"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                placeholder="116.4536"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" loading={saving} onClick={handleSave}>
            {editing ? '更新门店' : '创建门店'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
