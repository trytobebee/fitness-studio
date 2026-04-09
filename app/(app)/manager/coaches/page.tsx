'use client'
import { useState, useEffect, useCallback } from 'react'
import { Dumbbell, Phone, Trash2, Pencil, Plus, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

type Coach = {
  id: string
  user: { id: string; name: string; phone: string; isActive: boolean }
  bio: string | null
  specialties: string | null
  experience: number | null
  coachStores: { store: { id: string; name: string } }[]
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coach | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    bio: '',
    specialties: '',
    experience: '',
    storeIds: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const [coachRes, storeRes] = await Promise.all([
        fetch('/api/coaches').then((r) => r.json()),
        fetch('/api/stores').then((r) => r.json()),
      ])
      setCoaches(coachRes.data || [])
      setStores(storeRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  function openNew() {
    setEditing(null)
    setForm({
      name: '',
      phone: '',
      password: 'coach123',
      bio: '',
      specialties: '',
      experience: '',
      storeIds: [],
    })
    setError('')
    setDialogOpen(true)
  }

  function openEdit(coach: Coach) {
    setEditing(coach)
    setForm({
      name: coach.user.name,
      phone: coach.user.phone,
      password: '',
      bio: coach.bio || '',
      specialties: coach.specialties || '',
      experience: coach.experience?.toString() || '',
      storeIds: coach.coachStores.map((cs) => cs.store.id),
    })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.phone) {
      setError('姓名和手机号为必填项')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        // 编辑教练资料
        const res = await fetch(`/api/coaches/${editing.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bio: form.bio,
            specialties: form.specialties,
            experience: form.experience ? Number(form.experience) : null,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || '保存失败')
          return
        }
      } else {
        // 创建新教练
        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            password: form.password,
            role: 'COACH',
          }),
        })
        if (!userRes.ok) {
          const d = await userRes.json()
          setError(d.error || '创建失败')
          return
        }
      }

      setDialogOpen(false)
      fetch_()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(coachId: string) {
    if (deleting !== coachId) {
      setDeleting(coachId)
      return
    }
    try {
      await fetch(`/api/coaches/${coachId}`, { method: 'DELETE' })
      fetch_()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="教练管理"
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
        ) : coaches.length === 0 ? (
          <EmptyState icon={Dumbbell} title="暂无教练" action={<Button onClick={openNew}>新增教练</Button>} />
        ) : (
          <Card>
            <div className="divide-y divide-gray-50">
              {coaches.map((coach) => {
                const specialties = coach.specialties?.split(',').filter(Boolean) || []
                return (
                  <div key={coach.user.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-white">{coach.user.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{coach.user.name}</p>
                        {coach.experience && (
                          <Badge variant="default">{coach.experience}年</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {coach.user.phone}
                      </div>
                      {coach.coachStores.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {coach.coachStores.map((cs, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              {cs.store.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {specialties.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(coach)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coach.user.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deleting === coach.user.id ? 'bg-red-50 text-red-500' : 'hover:bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? '编辑教练' : '新增教练'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="教练姓名"
              disabled={!!editing}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号 *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="11位手机号"
              disabled={!!editing}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">初始密码</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="默认 coach123"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">简介</label>
            <textarea
              rows={2}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="教练简介"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">擅长领域</label>
            <input
              type="text"
              value={form.specialties}
              onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
              placeholder="多个领域用逗号分隔，如：瑜伽,普拉提"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">从业年限</label>
            <input
              type="number"
              min="0"
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              placeholder="年数"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" loading={saving} onClick={handleSave}>
            {editing ? '更新教练' : '创建教练'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
