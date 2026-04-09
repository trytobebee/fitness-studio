import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Dumbbell, BookOpen, Package, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

export default async function ManageHubPage() {
  const session = await getSession()
  if (!session || !['MANAGER', 'SUPER_ADMIN'].includes(session.role)) redirect('/login')

  const storeFilter = session.storeId ? { storeId: session.storeId } : {}

  const [clientCount, coachCount, courseTypeCount, packageCount] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
    prisma.user.count({ where: { role: 'COACH', isActive: true } }),
    prisma.courseType.count({ where: { isActive: true } }),
    prisma.creditPackage.count({ where: { isActive: true } }),
  ])

  const navItems = [
    {
      href: '/manager/clients',
      icon: Users,
      label: '客户管理',
      desc: '客户信息、课时开通、代客约课',
      count: clientCount,
      countLabel: '位客户',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      href: '/manager/coaches',
      icon: Dumbbell,
      label: '教练管理',
      desc: '教练信息、专长、所在门店',
      count: coachCount,
      countLabel: '位教练',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      href: '/manager/courses',
      icon: BookOpen,
      label: '课程种类',
      desc: '课程类型、时长、容量配置',
      count: courseTypeCount,
      countLabel: '个课程',
      color: 'bg-green-50 text-green-600',
    },
    {
      href: '/manager/packages',
      icon: Package,
      label: '课时套餐',
      desc: '套餐配置、价格、有效期',
      count: packageCount,
      countLabel: '个套餐',
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="管理中心" />

      <div className="px-4 py-4 mb-nav space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-4 px-4 py-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{item.count}</p>
                      <p className="text-xs text-gray-400">{item.countLabel}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
