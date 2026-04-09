import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Clock, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import { CheckinButton } from './CheckinButton'

export default async function CoachClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const cls = await prisma.scheduledClass.findUnique({
    where: { id },
    include: {
      courseType: true,
      store: true,
      bookings: {
        include: { clientProfile: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!cls) notFound()

  const checkedInCount = cls.bookings.filter(b => b.status === 'CHECKED_IN').length
  const confirmedCount = cls.bookings.filter(b => b.status === 'CONFIRMED').length

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="课程详情" backHref="/coach" />

      <div className="px-4 py-4 space-y-4 mb-nav">
        {/* 课程信息 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">{cls.courseType.name}</h2>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {format(new Date(cls.startTime), 'M月d日 HH:mm')} – {format(new Date(cls.endTime), 'HH:mm')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {cls.store.name}{cls.location ? ` · ${cls.location}` : ''}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 签到统计 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '已预约', value: confirmedCount, color: 'text-blue-600' },
            { label: '已签到', value: checkedInCount, color: 'text-green-600' },
            { label: '总容量', value: cls.maxCapacity, color: 'text-gray-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-3 pb-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 学员名单 */}
        <Card>
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-900">学员名单</h3>
          </div>
          {cls.bookings.length === 0 ? (
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-4">暂无预约学员</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-50">
              {cls.bookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-600">
                      {booking.clientProfile.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{booking.clientProfile.user.name}</p>
                    <p className="text-xs text-gray-400">{booking.clientProfile.user.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={booking.status} />
                    {booking.status === 'CONFIRMED' && cls.status !== 'CANCELLED' && (
                      <CheckinButton bookingId={booking.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
