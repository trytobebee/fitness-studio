import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Phone, CalendarPlus, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import { AddCreditsButton } from './AddCreditsButton'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      clientProfile: {
        include: {
          creditAccounts: {
            include: { package: { include: { courseType: true } } },
            orderBy: { purchasedAt: 'desc' },
          },
          bookings: {
            include: {
              scheduledClass: {
                include: { courseType: true, store: true, coach: { include: { user: true } } },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      },
    },
  })

  if (!user || !user.clientProfile) notFound()

  const packages = await prisma.creditPackage.findMany({ where: { isActive: true } })

  const totalCredits = user.clientProfile.creditAccounts
    .filter(a => a.isActive)
    .reduce((sum, a) => sum + a.remainingCredits, 0)

  const genderMap: Record<string, string> = { MALE: '男', FEMALE: '女', OTHER: '其他' }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="客户详情" backHref="/manager/clients" />

      <div className="px-4 py-4 space-y-4 mb-nav">
        {/* 客户信息 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{user.name.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  {user.phone}
                </div>
                {user.clientProfile.gender && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {genderMap[user.clientProfile.gender]}
                    {user.clientProfile.birthday && ` · ${format(new Date(user.clientProfile.birthday), 'yyyy-MM-dd')}`}
                  </p>
                )}
              </div>
            </div>
            {user.clientProfile.notes && (
              <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{user.clientProfile.notes}</p>
            )}
          </CardContent>
        </Card>

        {/* 课时概览 */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <p className="text-indigo-200 text-sm mb-1">课时余额</p>
          <p className="text-5xl font-bold mb-1">{totalCredits}</p>
          <p className="text-indigo-200 text-sm">节</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <AddCreditsButton clientProfileId={user.clientProfile.id} packages={packages} />
          <Link
            href={`/manager/clients/${user.id}/booking`}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-2xl px-4 py-3 text-sm font-medium active:bg-gray-50"
          >
            <CalendarPlus className="w-4 h-4" />
            为TA约课
          </Link>
        </div>

        {/* 课时账户 */}
        {user.clientProfile.creditAccounts.length > 0 && (
          <Card>
            <div className="px-4 pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">课时账户</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {user.clientProfile.creditAccounts.map((account) => (
                <div key={account.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.package.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {account.package.courseType ? account.package.courseType.name : '通用课时'}
                        {account.expiresAt && ` · 到期 ${format(new Date(account.expiresAt), 'yyyy-MM-dd')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-indigo-600">{account.remainingCredits}</p>
                      <p className="text-xs text-gray-400">/ {account.totalCredits}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 预约记录 */}
        <Card>
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-900">预约记录</h3>
          </div>
          {user.clientProfile.bookings.length === 0 ? (
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-4">暂无预约记录</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-50">
              {user.clientProfile.bookings.map((booking) => (
                <div key={booking.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.scheduledClass.courseType.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(booking.scheduledClass.startTime), 'MM-dd HH:mm')} · {booking.scheduledClass.store.name}
                      </p>
                      <p className="text-xs text-gray-400">{booking.scheduledClass.coach.user.name} 教练</p>
                    </div>
                    <StatusBadge status={booking.status} />
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
