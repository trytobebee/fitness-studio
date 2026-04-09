import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { format, subDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { TrendingUp, Users, CalendarCheck, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

export default async function AdminStatsPage() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/login')

  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)
  const weekAgo = subDays(today, 7)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    todayClasses,
    todayBookings,
    weekClasses,
    weekBookings,
    totalClients,
    totalCoaches,
    totalCreditsIssued,
    storeStats,
  ] = await Promise.all([
    prisma.scheduledClass.count({ where: { startTime: { gte: today, lt: tomorrow } } }),
    prisma.booking.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.scheduledClass.count({ where: { startTime: { gte: weekAgo, lt: tomorrow } } }),
    prisma.booking.count({ where: { createdAt: { gte: weekAgo, lt: tomorrow } } }),
    prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
    prisma.user.count({ where: { role: 'COACH', isActive: true } }),
    prisma.creditAccount.aggregate({ _sum: { totalCredits: true } }),
    prisma.store.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            scheduledClasses: { where: { startTime: { gte: weekAgo, lt: tomorrow } } },
          },
        },
      },
    }),
  ])

  const dateStr = format(today, 'yyyy年M月d日', { locale: zhCN })

  const overviewStats = [
    { label: '今日排课', value: todayClasses, sub: `本周共 ${weekClasses} 节`, icon: CalendarCheck, color: 'bg-indigo-50 text-indigo-600' },
    { label: '今日预约', value: todayBookings, sub: `本周共 ${weekBookings} 次`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: '会员总数', value: totalClients, sub: '活跃会员', icon: Users, color: 'bg-amber-50 text-amber-600' },
    { label: '教练总数', value: totalCoaches, sub: '在职教练', icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="数据统计" />

      <div className="px-4 py-4 space-y-4 mb-nav">
        <p className="text-sm text-gray-400">{dateStr} · 全网数据</p>

        {/* 概览 */}
        <div className="grid grid-cols-2 gap-3">
          {overviewStats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="pt-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 课时总量 */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 mb-1">累计售出课时</p>
            <p className="text-3xl font-bold text-indigo-600">
              {totalCreditsIssued._sum.totalCredits ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">节</p>
          </CardContent>
        </Card>

        {/* 各门店本周课程数 */}
        <Card>
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-900">本周各店排课</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {storeStats.map((store) => (
              <div key={store.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{store.name}</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${Math.min((store._count.scheduledClasses / Math.max(...storeStats.map(s => s._count.scheduledClasses), 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-6 text-right">
                    {store._count.scheduledClasses}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
