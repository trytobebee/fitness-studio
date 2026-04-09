'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, MapPin, Users, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ClassItem = {
  id: string; startTime: string; endTime: string; maxCapacity: number; location: string | null; status: string
  courseType: { id: string; name: string; color: string }
  coach: { user: { name: string } }
  store: { name: string }
  _count: { bookings: number }
}

type CourseType = { id: string; name: string; color: string }

export default function ClientBookPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([])
  const [selectedCourseType, setSelectedCourseType] = useState('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  useEffect(() => {
    fetch('/api/course-types').then(r => r.json()).then(d => setCourseTypes(d.data || []))
  }, [])

  const fetchClasses = useCallback(async (date: Date, ctId: string) => {
    setLoading(true)
    const start = format(date, 'yyyy-MM-dd')
    const end = format(addDays(date, 1), 'yyyy-MM-dd')
    let url = `/api/scheduled-classes?startDate=${start}&endDate=${end}&status=OPEN`
    if (ctId) url += `&courseTypeId=${ctId}`
    const res = await fetch(url)
    const data = await res.json()
    setClasses(data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClasses(selectedDate, selectedCourseType) }, [selectedDate, selectedCourseType, fetchClasses])

  async function handleBook() {
    if (!selectedClass) return
    setBooking(true)
    setError('')
    try {
      // 先获取 clientProfileId
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      const clientProfileId = meData.data?.clientProfile?.id
      if (!clientProfileId) { setError('未找到客户资料'); return }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledClassId: selectedClass.id, clientProfileId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '预约失败'); return }
      setSuccess(true)
      fetchClasses(selectedDate, selectedCourseType)
      setTimeout(() => { setSelectedClass(null); setSuccess(false) }, 2000)
    } catch { setError('网络错误') } finally { setBooking(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="约课" />

      {/* 日期选择 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {dates.map((date, i) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {i === 0 ? '今天' : i === 1 ? '明天' : format(date, 'EEE', { locale: zhCN })}
                </span>
                <span className="text-sm font-bold">{format(date, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 课程类型筛选 */}
      {courseTypes.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCourseType('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedCourseType ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              全部
            </button>
            {courseTypes.map(ct => (
              <button
                key={ct.id}
                onClick={() => setSelectedCourseType(ct.id === selectedCourseType ? '' : ct.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCourseType === ct.id ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                style={selectedCourseType === ct.id ? { backgroundColor: ct.color } : {}}
              >
                {ct.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 mb-nav space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : classes.length === 0 ? (
          <EmptyState icon={CalendarDays} title="暂无可预约课程" description="换个日期或课程类型试试" />
        ) : (
          classes.map((cls) => {
            const remaining = cls.maxCapacity - cls._count.bookings
            return (
              <Card key={cls.id} className="overflow-hidden active:scale-[0.99] transition-transform cursor-pointer" onClick={() => { setSelectedClass(cls); setError(''); setSuccess(false) }}>
                <div className="flex">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
                  <div className="flex-1 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-gray-900">{cls.courseType.name}</p>
                      {remaining <= 3 ? (
                        <Badge variant="warning">仅剩 {remaining} 位</Badge>
                      ) : (
                        <Badge variant="success">余 {remaining} 位</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{format(new Date(cls.startTime), 'HH:mm')}–{format(new Date(cls.endTime), 'HH:mm')}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{cls.store.name}{cls.location ? ` · ${cls.location}` : ''}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{cls.coach.user.name} 教练</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={!!selectedClass} onClose={() => setSelectedClass(null)} title="确认预约">
        {selectedClass && (
          <div className="space-y-4">
            {success ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <CheckCircle className="w-14 h-14 text-green-500" />
                <p className="text-base font-semibold text-gray-900">预约成功！</p>
                <p className="text-sm text-gray-500">记得准时出席哦</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                  <p className="font-semibold text-gray-900">{selectedClass.courseType.name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedClass.startTime), 'yyyy年M月d日 HH:mm')}
                    –{format(new Date(selectedClass.endTime), 'HH:mm')}
                  </p>
                  <p className="text-sm text-gray-500">{selectedClass.store.name} · {selectedClass.coach.user.name} 教练</p>
                </div>
                <p className="text-sm text-gray-500 text-center bg-amber-50 rounded-xl py-2">将消耗 <span className="font-bold text-amber-600">1</span> 课时</p>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <Button className="w-full" loading={booking} onClick={handleBook}>确认预约</Button>
              </>
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}
