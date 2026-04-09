'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Users, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { BookOpen } from 'lucide-react'

type CourseType = { id: string; name: string; description: string | null; color: string; duration: number; maxCapacity: number; isActive: boolean }

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseType | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', duration: 60, maxCapacity: 10 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/course-types')
    const data = await res.json()
    setCourses(data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '', color: '#6366f1', duration: 60, maxCapacity: 10 })
    setError('')
    setDialogOpen(true)
  }

  function openEdit(ct: CourseType) {
    setEditing(ct)
    setForm({ name: ct.name, description: ct.description || '', color: ct.color, duration: ct.duration, maxCapacity: ct.maxCapacity })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name) { setError('请填写课程名称'); return }
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/course-types/${editing.id}` : '/api/course-types'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); setError(d.error || '保存失败'); return }
      setDialogOpen(false)
      fetch_()
    } catch { setError('网络错误') } finally { setSaving(false) }
  }

  async function toggleActive(ct: CourseType) {
    await fetch(`/api/course-types/${ct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !ct.isActive }),
    })
    fetch_()
  }

  const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4']

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="课程种类" action={
        <button onClick={openNew} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> 新增
        </button>
      } />

      <div className="px-4 py-4 mb-nav">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="暂无课程种类" action={<Button onClick={openNew}>新增课程</Button>} />
        ) : (
          <div className="space-y-3">
            {courses.map((ct) => (
              <Card key={ct.id} className="overflow-hidden">
                <div className="flex">
                  <div className="w-1.5 flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: ct.color }} />
                  <div className="flex-1 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{ct.name}</p>
                          {!ct.isActive && <Badge variant="danger">已停用</Badge>}
                        </div>
                        {ct.description && <p className="text-xs text-gray-400 mt-0.5">{ct.description}</p>}
                        <div className="flex gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{ct.duration}分钟</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />最多{ct.maxCapacity}人</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(ct)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(ct)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${ct.isActive ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}
                        >
                          {ct.isActive ? '停用' : '启用'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? '编辑课程种类' : '新增课程种类'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">课程名称 *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="如：瑜伽基础" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">简介</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="课程简介（选填）" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">时长（分钟）</label>
              <input type="number" min={15} max={180} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最大容量</label>
              <input type="number" min={1} max={100} value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">颜色标签</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" loading={saving} onClick={handleSave}>保存</Button>
        </div>
      </Dialog>
    </div>
  )
}
