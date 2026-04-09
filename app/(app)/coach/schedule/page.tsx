'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Calendar } from 'lucide-react'

type ClassItem = {
  id: string; startTime: string; endTime: string; location: string | null; status: string
  courseType: { name: string; color: string }
  store: { name: string }
  _count: { bookings: number }; maxCapacity: number
}

export default function CoachSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']

  const fetchClasses = useCallback(async (date: Date) => {
    setLoading(true)
    const start = format(date, 'yyyy-MM-dd')
    const end = format(addDays(date, 1), 'yyyy-MM-dd')
    const res = await fetch(`/api/scheduled-classes?startDate=${start}&endDate=${end}`)
    const data = await res.json()
    setClasses(data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClasses(selectedDate) }, [selectedDate, fetchClasses])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="我的课表" />
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700">{format(weekStart, 'yyyy年M月', { locale: zhCN })}</span>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            return (
              <button key={i} onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-2 rounded-xl transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}>
                <span className={`text-[10px] mb-1 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>{dayNames[i]}</span>
                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : isToday ? 'text-indigo-600' : 'text-gray-900'}`}>{format(day, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="px-4 py-3 mb-nav space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : classes.length === 0 ? (
          <EmptyState icon={Calendar} title="当日暂无课程" />
        ) : (
          classes.map((cls) => (
            <Link key={cls.id} href={`/coach/classes/${cls.id}`}>
              <Card className="overflow-hidden active:scale-[0.99] transition-transform">
                <div className="flex">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
                  <div className="flex-1 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{cls.courseType.name}</p>
                        <div className="flex flex-wrap gap-x-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{format(new Date(cls.startTime), 'HH:mm')}–{format(new Date(cls.endTime), 'HH:mm')}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{cls.store.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={cls.status} />
                        <span className="text-xs text-gray-400">{cls._count.bookings}/{cls.maxCapacity}人</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
