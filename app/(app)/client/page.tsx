import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, MapPin, ChevronRight, CalendarPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default async function ClientHomePage() {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') redirect('/login')

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    include: {
      creditAccounts: {
        where: { isActive: true, remainingCredits: { gt: 0 } },
        include: { package: { include: { courseType: true } } },
        orderBy: { expiresAt: 'asc' },
      },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        include: {
          scheduledClass: {
            include: { courseType: true, store: true, coach: { include: { user: true } } },
          },
        },
        orderBy: { scheduledClass: { startTime: 'asc' } },
        take: 5,
      },
    },
  })

  if (!clientProfile) redirect('/login')

  const totalCredits = clientProfile.creditAccounts.reduce((sum, a) => sum + a.remainingCredits, 0)
  const nextClass = clientProfile.bookings[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateStr = format(new Date(), 'M月d日 EEEE', { locale: zhCN })

  // 分组显示课时
  const creditGroups = clientProfile.creditAccounts.reduce((acc, account) => {
    const key = account.package.courseTypeId || 'general'
    const name = account.package.courseType?.name || '通用课时'
    if (!acc[key]) acc[key] = { name, total: 0 }
    acc[key].total += account.remainingCredits
    return acc
  }, {} as Record<string, { name: string; total: number }>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-5 pt-12 pb-8">
        <p className="text-indigo-200 text-sm mb-1">{dateStr}</p>
        <h1 className="text-xl font-bold text-white mb-6">你好，{session.name} 👋</h1>

        {/* 课时卡片 */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
          <p className="text-indigo-200 text-sm mb-2">剩余课时</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-6xl font-bold text-white leading-none">{totalCredits}</span>
            <span className="text-indigo-200 mb-1">节</span>
          </div>
          {Object.keys(creditGroups).length > 1 && (
            <div className="flex flex-wrap gap-2">
              {Object.values(creditGroups).map((g, i) => (
                <span key={i} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                  {g.name} {g.total}节
                </span>
              ))}
            </div>
          )}
          {totalCredits === 0 && (
            <p className="text-indigo-200 text-sm">课时已用完，请联系门店充值</p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4 mb-nav">
        {/* 快捷约课 */}
        <Link
          href="/client/book"
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl py-3.5 text-sm font-medium shadow-md shadow-indigo-200 active:bg-indigo-700 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          立即约课
        </Link>

        {/* 下次课程 */}
        {nextClass && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">下次上课</h2>
            <Card className="overflow-hidden">
              <div className="flex">
                <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: nextClass.scheduledClass.courseType.color }} />
                <div className="px-4 py-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{nextClass.scheduledClass.courseType.name}</p>
                      <div className="space-y-1 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {format(new Date(nextClass.scheduledClass.startTime), 'M月d日 HH:mm')}
                          –{format(new Date(nextClass.scheduledClass.endTime), 'HH:mm')}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />{nextClass.scheduledClass.store.name}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{nextClass.scheduledClass.coach.user.name} 教练</p>
                    </div>
                    <StatusBadge status={nextClass.status} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 预约记录 */}
        {clientProfile.bookings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">即将上课</h2>
              <Link href="/client/bookings" className="text-xs text-indigo-600 flex items-center gap-0.5">
                全部记录 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <Card>
              <div className="divide-y divide-gray-50">
                {clientProfile.bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: booking.scheduledClass.courseType.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{booking.scheduledClass.courseType.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(booking.scheduledClass.startTime), 'M月d日 HH:mm')} · {booking.scheduledClass.store.name}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
