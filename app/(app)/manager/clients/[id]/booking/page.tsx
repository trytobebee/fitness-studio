'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, MapPin, Users, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { CalendarDays } from 'lucide-react'

type ClassItem = {
  id: string; startTime: string; endTime: string; maxCapacity: number; location: string | null
  courseType: { name: string; color: string }
  coach: { user: { name: string } }
  store: { name: string }
  _count: { bookings: number }
}

export default function ClientBookingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [clientProfileId, setClientProfileId] = useState('')

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(d => {
      setClientProfileId(d.data?.clientProfile?.id || '')
    })
  }, [id])

  const fetchClasses = useCallback(async (date: Date) => {
    setLoading(true)
    const start = format(date, 'yyyy-MM-dd')
    const end = format(addDays(date, 1), 'yyyy-MM-dd')
    const res = await fetch(`/api/scheduled-classes?startDate=${start}&endDate=${end}&status=OPEN`)
    const data = await res.json()
    setClasses(data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClasses(selectedDate) }, [selectedDate, fetchClasses])

  async function handleBook() {
    if (!selectedClass || !clientProfileId) return
    setBooking(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledClassId: selectedClass.id, clientProfileId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '预约失败'); return }
      setSuccess(true)
      setTimeout(() => { setSelectedClass(null); setSuccess(false); router.push(`/manager/clients/${id}`) }, 1500)
    } catch { setError('网络错误') } finally { setBooking(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="为客户约课" backHref={`/manager/clients/${id}`} />

      {/* 日期选择 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {dates.map((date, i) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
                <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {i === 0 ? '今天' : format(date, 'EEE', { locale: zhCN })}
                </span>
                <span className="text-sm font-bold">{format(date, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-3 mb-nav space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : classes.length === 0 ? (
          <EmptyState icon={CalendarDays} title="当日暂无可预约课程" />
        ) : (
          classes.map((cls) => (
            <Card key={cls.id} className="overflow-hidden active:scale-[0.99] transition-transform cursor-pointer" onClick={() => setSelectedClass(cls)}>
              <div className="flex">
                <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
                <div className="flex-1 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-gray-900">{cls.courseType.name}</p>
                    <span className="text-xs text-gray-400">
                      余 {cls.maxCapacity - cls._count.bookings} 位
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{format(new Date(cls.startTime), 'HH:mm')}–{format(new Date(cls.endTime), 'HH:mm')}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{cls.store.name}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{cls.coach.user.name}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedClass} onClose={() => { setSelectedClass(null); setError(''); setSuccess(false) }} title="确认预约">
        {selectedClass && (
          <div className="space-y-4">
            {success ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="text-base font-medium text-gray-900">预约成功！</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-900">{selectedClass.courseType.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{format(new Date(selectedClass.startTime), 'yyyy年M月d日 HH:mm')}–{format(new Date(selectedClass.endTime), 'HH:mm')}</p>
                  <p className="text-sm text-gray-500">{selectedClass.store.name} · {selectedClass.coach.user.name} 教练</p>
                </div>
                <p className="text-sm text-gray-500 text-center">将消耗客户 1 课时</p>
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
