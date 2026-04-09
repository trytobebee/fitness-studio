import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Building2, Users, Dumbbell, CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminHomePage() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [storeCount, coachCount, clientCount, todayClassCount, stores] = await Promise.all([
    prisma.store.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'COACH', isActive: true } }),
    prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
    prisma.scheduledClass.count({ where: { startTime: { gte: today, lt: tomorrow } } }),
    prisma.store.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            scheduledClasses: { where: { startTime: { gte: today, lt: tomorrow } } },
            coachStores: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const dateStr = format(new Date(), 'M月d日 EEEE', { locale: zhCN })

  const stats = [
    { label: '门店总数', value: storeCount, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: '教练总数', value: coachCount, icon: Dumbbell, color: 'bg-amber-50 text-amber-600' },
    { label: '会员总数', value: clientCount, icon: Users, color: 'bg-green-50 text-green-600' },
    { label: '今日课程', value: todayClassCount, icon: CalendarDays, color: 'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-5 pt-12 pb-6">
        <p className="text-indigo-200 text-sm mb-1">{dateStr}</p>
        <h1 className="text-xl font-bold text-white">总部管理后台</h1>
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

        {/* 门店列表 */}
        <Card>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">门店列表</h2>
            <Badge variant="default">{storeCount} 家</Badge>
          </div>
          <div className="divide-y divide-gray-50">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{store.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{store.address}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">今日 {store._count.scheduledClasses} 课</p>
                  <p className="text-xs text-gray-400">{store._count.coachStores} 位教练</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 快捷导航 */}
        <Card>
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900">管理功能</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { href: '/manager/coaches', label: '教练管理', desc: '查看所有教练信息' },
              { href: '/manager/clients', label: '会员管理', desc: '查看所有会员信息' },
              { href: '/manager/courses', label: '课程管理', desc: '管理课程种类' },
              { href: '/manager/schedule', label: '排课管理', desc: '全局排课查看' },
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
