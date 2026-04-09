import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, MapPin, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Calendar } from 'lucide-react'

export default async function CoachHomePage() {
  const session = await getSession()
  if (!session || session.role !== 'COACH') redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: session.userId } })

  const todayClasses = coachProfile ? await prisma.scheduledClass.findMany({
    where: { coachId: coachProfile.id, startTime: { gte: today, lt: tomorrow } },
    include: {
      courseType: true,
      store: true,
      bookings: { where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } } },
    },
    orderBy: { startTime: 'asc' },
  }) : []

  const dateStr = format(new Date(), 'M月d日 EEEE', { locale: zhCN })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-5 pt-12 pb-6">
        <p className="text-indigo-200 text-sm mb-1">{dateStr}</p>
        <h1 className="text-xl font-bold text-white">你好，{session.name} 👋</h1>
        <p className="text-indigo-200 text-sm mt-1">今日 {todayClasses.length} 节课</p>
      </div>

      <div className="px-4 -mt-2 py-4 space-y-3 mb-nav">
        {todayClasses.length === 0 ? (
          <EmptyState icon={Calendar} title="今日暂无课程" description="好好休息吧～" />
        ) : (
          todayClasses.map((cls) => (
            <Link key={cls.id} href={`/coach/classes/${cls.id}`}>
              <Card className="overflow-hidden active:scale-[0.99] transition-transform">
                <div className="flex">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
                  <div className="flex-1 px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{cls.courseType.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(cls.startTime), 'HH:mm')}–{format(new Date(cls.endTime), 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />{cls.store.name}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={cls.status} />
                    </div>

                    {/* 容量进度条 */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {cls.bookings.length}/{cls.maxCapacity} 人预约
                        </span>
                        <span className="text-xs text-indigo-600 flex items-center gap-0.5">
                          查看名单 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.min(cls.bookings.length / cls.maxCapacity * 100, 100)}%` }}
                        />
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
