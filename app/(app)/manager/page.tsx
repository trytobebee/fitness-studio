import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Users, UserCheck, Dumbbell, ChevronRight, Plus, MapPin, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default async function ManagerHomePage() {
  const session = await getSession()
  if (!session || !['MANAGER', 'SUPER_ADMIN'].includes(session.role)) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekLater = new Date(today)
  weekLater.setDate(weekLater.getDate() + 7)

  const storeFilter = session.storeId ? { storeId: session.storeId } : {}

  const [todayClasses, todayBookingsCount, coachCount, clientCount] = await Promise.all([
    prisma.scheduledClass.findMany({
      where: { ...storeFilter, startTime: { gte: today, lt: tomorrow } },
      include: {
        courseType: true,
        coach: { include: { user: true } },
        store: true,
        _count: { select: { bookings: { where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } } } } },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        ...(session.storeId ? { scheduledClass: { storeId: session.storeId } } : {}),
      },
    }),
    prisma.user.count({ where: { role: 'COACH', isActive: true } }),
    prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
  ])

  const dateStr = format(new Date(), 'M月d日 EEEE', { locale: zhCN })

  const stats = [
    { label: '今日课程', value: todayClasses.length, icon: CalendarDays, color: 'bg-indigo-50 text-indigo-600' },
    { label: '今日预约', value: todayBookingsCount, icon: UserCheck, color: 'bg-green-50 text-green-600' },
    { label: '教练总数', value: coachCount, icon: Dumbbell, color: 'bg-amber-50 text-amber-600' },
    { label: '客户总数', value: clientCount, icon: Users, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-5 pt-12 pb-6">
        <p className="text-indigo-200 text-sm mb-1">{dateStr}</p>
        <h1 className="text-xl font-bold text-white">你好，{session.name} 👋</h1>
      </div>

      <div className="px-4 -mt-4 space-y-4 mb-nav">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="pt-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 快捷操作 */}
        <div className="flex gap-3">
          <Link href="/manager/schedule/new" className="flex-1 flex items-center gap-2 bg-indigo-600 text-white rounded-2xl px-4 py-3 text-sm font-medium active:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            新建排课
          </Link>
          <Link href="/manager/clients/new" className="flex-1 flex items-center gap-2 bg-white text-gray-700 rounded-2xl px-4 py-3 text-sm font-medium border border-gray-200 active:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4" />
            新增客户
          </Link>
        </div>

        {/* 今日课程 */}
        <Card>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">今日课程</h2>
            <Link href="/manager/schedule" className="text-xs text-indigo-600 flex items-center gap-0.5">
              查看全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-4">今日暂无课程</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayClasses.map((cls) => (
                <Link key={cls.id} href={`/manager/schedule/${cls.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cls.courseType.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{cls.courseType.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {format(new Date(cls.startTime), 'HH:mm')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {cls.store.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {cls._count.bookings}/{cls.maxCapacity}人
                    </span>
                    <StatusBadge status={cls.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* 快速导航 */}
        <Card>
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900">管理功能</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { href: '/manager/courses', label: '课程种类管理', desc: '管理瑜伽、普拉提等课程类型' },
              { href: '/manager/coaches', label: '教练管理', desc: '查看教练信息和排课情况' },
              { href: '/manager/clients', label: '客户管理', desc: '客户信息、课时和预约管理' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
