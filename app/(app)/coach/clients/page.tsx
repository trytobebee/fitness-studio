import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export default async function CoachClientsPage() {
  const session = await getSession()
  if (!session || session.role !== 'COACH') redirect('/login')

  const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: session.userId } })

  // 查找上过该教练课的所有客户（去重）
  const bookings = coachProfile ? await prisma.booking.findMany({
    where: {
      scheduledClass: { coachId: coachProfile.id },
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
    },
    include: { clientProfile: { include: { user: true } } },
    distinct: ['clientProfileId'],
  }) : []

  // 统计每个客户上课次数
  const clientClassCounts = coachProfile ? await prisma.booking.groupBy({
    by: ['clientProfileId'],
    where: {
      scheduledClass: { coachId: coachProfile.id },
      status: { in: ['CHECKED_IN', 'COMPLETED'] },
    },
    _count: { id: true },
  }) : []

  const countMap = new Map(clientClassCounts.map(c => [c.clientProfileId, c._count.id]))

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="我的学员" />
      <div className="px-4 py-4 mb-nav">
        {bookings.length === 0 ? (
          <EmptyState icon={Users} title="暂无学员" description="还没有学员预约你的课程" />
        ) : (
          <Card>
            <div className="divide-y divide-gray-50">
              {bookings.map((booking) => {
                const count = countMap.get(booking.clientProfileId) || 0
                return (
                  <div key={booking.clientProfileId} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600">
                        {booking.clientProfile.user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{booking.clientProfile.user.name}</p>
                      <p className="text-xs text-gray-400">{booking.clientProfile.user.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">{count}</p>
                      <p className="text-xs text-gray-400">节课</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
