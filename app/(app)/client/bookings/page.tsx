'use client'
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Clock, MapPin, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ClipboardList } from 'lucide-react'

type Booking = {
  id: string; status: string; createdAt: string
  scheduledClass: {
    startTime: string; endTime: string
    courseType: { name: string; color: string }
    store: { name: string }
    coach: { user: { name: string } }
  }
}

export default function ClientBookingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      const clientProfileId = meData.data?.clientProfile?.id
      if (!clientProfileId) return
      const res = await fetch(`/api/bookings?clientProfileId=${clientProfileId}`)
      const data = await res.json()
      setBookings(data.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function handleCancel(bookingId: string) {
    setCancelling(bookingId)
    try {
      await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
      fetchBookings()
    } finally {
      setCancelling(null)
    }
  }

  const now = new Date()
  const upcoming = bookings.filter(b =>
    ['CONFIRMED', 'CHECKED_IN'].includes(b.status) &&
    new Date(b.scheduledClass.startTime) > now
  ).sort((a, b) => new Date(a.scheduledClass.startTime).getTime() - new Date(b.scheduledClass.startTime).getTime())

  const history = bookings.filter(b =>
    !['CONFIRMED'].includes(b.status) || new Date(b.scheduledClass.startTime) <= now
  ).sort((a, b) => new Date(b.scheduledClass.startTime).getTime() - new Date(a.scheduledClass.startTime).getTime())

  const displayList = tab === 'upcoming' ? upcoming : history

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="预约记录" />

      {/* Tab */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-1">
        {([['upcoming', '即将上课'], ['history', '历史记录']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${tab === key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
          >
            {label}
            {key === 'upcoming' && upcoming.length > 0 && (
              <span className="ml-1 bg-indigo-600 text-white text-xs px-1.5 rounded-full">{upcoming.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 mb-nav space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : displayList.length === 0 ? (
          <EmptyState icon={ClipboardList} title={tab === 'upcoming' ? '暂无即将上课' : '暂无历史记录'} />
        ) : (
          displayList.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: booking.scheduledClass.courseType.color }} />
                <div className="flex-1 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{booking.scheduledClass.courseType.name}</p>
                      <div className="space-y-1 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {format(new Date(booking.scheduledClass.startTime), 'M月d日 HH:mm')}–{format(new Date(booking.scheduledClass.endTime), 'HH:mm')}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />{booking.scheduledClass.store.name}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{booking.scheduledClass.coach.user.name} 教练</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-2">
                      <StatusBadge status={booking.status} />
                      {booking.status === 'CONFIRMED' && new Date(booking.scheduledClass.startTime) > now && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          {cancelling === booking.id ? '取消中...' : '取消预约'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
