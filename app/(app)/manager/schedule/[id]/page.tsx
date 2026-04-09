import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Clock, MapPin, Users, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { CancelClassButton } from './CancelClassButton'

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const cls = await prisma.scheduledClass.findUnique({
    where: { id },
    include: {
      courseType: true,
      coach: { include: { user: true } },
      store: true,
      bookings: {
        include: { clientProfile: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!cls) notFound()

  const confirmedCount = cls.bookings.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="排课详情" backHref="/manager/schedule" />

      <div className="px-4 py-4 space-y-4 mb-nav">
        {/* 课程信息卡片 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{cls.courseType.name}</h2>
                  <StatusBadge status={cls.status} />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {format(new Date(cls.startTime), 'yyyy年M月d日 HH:mm')} –{' '}
                    {format(new Date(cls.endTime), 'HH:mm')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {cls.store.name}{cls.location ? ` · ${cls.location}` : ''}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Dumbbell className="w-4 h-4 text-gray-400" />
                    教练：{cls.coach.user.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    已预约 {confirmedCount} / {cls.maxCapacity} 人
                  </div>
                </div>
                {cls.notes && (
                  <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{cls.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预约名单 */}
        <Card>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">预约名单</h3>
            <span className="text-sm text-gray-400">{cls.bookings.length} 人</span>
          </div>
          {cls.bookings.length === 0 ? (
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-4">暂无预约</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-50">
              {cls.bookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-indigo-600">
                      {booking.clientProfile.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{booking.clientProfile.user.name}</p>
                    <p className="text-xs text-gray-400">{booking.clientProfile.user.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={booking.status} />
                    {booking.checkedInAt && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(booking.checkedInAt), 'HH:mm')} 签到
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 操作按钮 */}
        {cls.status !== 'CANCELLED' && (
          <CancelClassButton classId={cls.id} />
        )}
      </div>
    </div>
  )
}
