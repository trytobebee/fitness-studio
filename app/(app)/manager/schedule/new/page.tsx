'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { format, addMinutes } from 'date-fns'

type CourseType = { id: string; name: string; duration: number; maxCapacity: number; color: string }
type Coach = { id: string; user: { name: string }; coachStores: { store: { id: string; name: string } }[] }
type Store = { id: string; name: string }

export default function NewSchedulePage() {
  const router = useRouter()
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState('')
  const [error, setError] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    courseTypeId: '',
    coachId: '',
    storeId: '',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    maxCapacity: 10,
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/course-types').then(r => r.json()),
      fetch('/api/coaches').then(r => r.json()),
      fetch('/api/stores').then(r => r.json()),
    ]).then(([ct, co, st]) => {
      setCourseTypes(ct.data || [])
      setCoaches(co.data || [])
      setStores(st.data || [])
    })
  }, [])

  function handleCourseTypeChange(id: string) {
    const ct = courseTypes.find(c => c.id === id)
    if (!ct) return
    const start = new Date(`${form.date}T${form.startTime}`)
    const end = addMinutes(start, ct.duration)
    setForm(f => ({
      ...f,
      courseTypeId: id,
      endTime: format(end, 'HH:mm'),
      maxCapacity: ct.maxCapacity,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setWarning('')
    if (!form.courseTypeId || !form.coachId || !form.storeId) {
      setError('请填写所有必填项')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/scheduled-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTypeId: form.courseTypeId,
          coachId: form.coachId,
          storeId: form.storeId,
          startTime: `${form.date}T${form.startTime}:00`,
          endTime: `${form.date}T${form.endTime}:00`,
          location: form.location,
          maxCapacity: Number(form.maxCapacity),
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '创建失败'); return }
      if (data.warning) {
        setWarning(data.warning)
        setTimeout(() => router.push('/manager/schedule'), 2000)
      } else {
        router.push('/manager/schedule')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="新建排课" backHref="/manager/schedule" />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 mb-nav">
        {/* 课程类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">课程类型 *</label>
          <select
            value={form.courseTypeId}
            onChange={e => handleCourseTypeChange(e.target.value)}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">请选择课程类型</option>
            {courseTypes.map(ct => (
              <option key={ct.id} value={ct.id}>{ct.name}（{ct.duration}分钟）</option>
            ))}
          </select>
        </div>

        {/* 教练 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">教练 *</label>
          <select
            value={form.coachId}
            onChange={e => setForm(f => ({ ...f, coachId: e.target.value }))}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">请选择教练</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>{c.user.name}</option>
            ))}
          </select>
        </div>

        {/* 门店 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">门店 *</label>
          <select
            value={form.storeId}
            onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">请选择门店</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">日期 *</label>
          <input
            type="date"
            value={form.date}
            min={today}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 时间 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">开始时间 *</label>
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">结束时间 *</label>
            <input
              type="time"
              value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 教室 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">教室/地点</label>
          <input
            type="text"
            placeholder="如：A号教室"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 容量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">最大容量</label>
          <input
            type="number"
            min={1}
            max={100}
            value={form.maxCapacity}
            onChange={e => setForm(f => ({ ...f, maxCapacity: Number(e.target.value) }))}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
          <textarea
            rows={3}
            placeholder="课程备注（选填）"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* 警告 */}
        {warning && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{warning}</p>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          创建排课
        </Button>
      </form>
    </div>
  )
}
