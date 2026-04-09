'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Package } from 'lucide-react'

type CourseType = { id: string; name: string }
type Pkg = {
  id: string; name: string; credits: number; price: number
  validDays: number | null; description: string | null; isActive: boolean
  courseType: CourseType | null
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Pkg | null>(null)
  const [form, setForm] = useState({ name: '', credits: 10, price: 680, validDays: '', courseTypeId: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [pkgRes, ctRes] = await Promise.all([
      fetch('/api/packages').then(r => r.json()),
      fetch('/api/course-types').then(r => r.json()),
    ])
    setPackages(pkgRes.data || [])
    setCourseTypes(ctRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function openNew() {
    setEditing(null)
    setForm({ name: '', credits: 10, price: 680, validDays: '', courseTypeId: '', description: '' })
    setError('')
    setDialogOpen(true)
  }

  function openEdit(pkg: Pkg) {
    setEditing(pkg)
    setForm({
      name: pkg.name, credits: pkg.credits, price: pkg.price,
      validDays: pkg.validDays?.toString() || '',
      courseTypeId: pkg.courseType?.id || '',
      description: pkg.description || '',
    })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name) { setError('请填写套餐名称'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name, credits: Number(form.credits), price: Number(form.price),
        validDays: form.validDays ? Number(form.validDays) : null,
        courseTypeId: form.courseTypeId || null,
        description: form.description || null,
      }
      const url = editing ? `/api/packages/${editing.id}` : '/api/packages'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); setError(d.error || '保存失败'); return }
      setDialogOpen(false)
      fetchAll()
    } catch { setError('网络错误') } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="课时套餐" action={
        <button onClick={openNew} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> 新增
        </button>
      } />

      <div className="px-4 py-4 mb-nav space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : packages.length === 0 ? (
          <EmptyState icon={Package} title="暂无套餐" action={<Button onClick={openNew}>新增套餐</Button>} />
        ) : (
          packages.map((pkg) => (
            <Card key={pkg.id} className="overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{pkg.name}</p>
                      {!pkg.isActive && <Badge variant="danger">已停用</Badge>}
                      {pkg.courseType && <Badge variant="purple">{pkg.courseType.name}</Badge>}
                    </div>
                    {pkg.description && <p className="text-xs text-gray-400 mt-0.5">{pkg.description}</p>}
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs text-gray-500">{pkg.credits} 课时</span>
                      {pkg.validDays && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />{pkg.validDays} 天有效
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-indigo-600">¥{pkg.price}</p>
                    <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? '编辑套餐' : '新增套餐'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">套餐名称 *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="如：通用10课时包" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">适用课程（空=通用）</label>
            <select value={form.courseTypeId} onChange={e => setForm(f => ({ ...f, courseTypeId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">通用（所有课程）</option>
              {courseTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">课时数 *</label>
              <input type="number" min={1} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">价格（¥）*</label>
              <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">有效期（天，空=永久）</label>
            <input type="number" min={1} value={form.validDays} onChange={e => setForm(f => ({ ...f, validDays: e.target.value }))}
              placeholder="如：90" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="套餐说明（选填）" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" loading={saving} onClick={handleSave}>保存</Button>
        </div>
      </Dialog>
    </div>
  )
}
