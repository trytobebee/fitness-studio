import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    if (session.role === 'SUPER_ADMIN') {
      // 全部门店数据
      const [storeCount, coachCount, clientCount, todayClassCount] = await Promise.all([
        prisma.store.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'COACH', isActive: true } }),
        prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
        prisma.scheduledClass.count({
          where: {
            startTime: { gte: todayStart, lte: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
      ])

      return NextResponse.json({
        data: {
          role: 'SUPER_ADMIN',
          storeCount,
          coachCount,
          clientCount,
          todayClassCount,
        },
      })
    }

    if (session.role === 'MANAGER') {
      if (!session.storeId) {
        return NextResponse.json({ error: '未关联门店' }, { status: 400 })
      }

      const storeId = session.storeId

      // 本周开始
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const [todayClassCount, todayBookingCount, activeClientsResult, totalCreditsResult] =
        await Promise.all([
          // 今日课程数
          prisma.scheduledClass.count({
            where: {
              storeId,
              startTime: { gte: todayStart, lte: todayEnd },
              status: { not: 'CANCELLED' },
            },
          }),
          // 今日预约数
          prisma.booking.count({
            where: {
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              scheduledClass: {
                storeId,
                startTime: { gte: todayStart, lte: todayEnd },
              },
            },
          }),
          // 本周活跃客户数（本周有预约的不同客户）
          prisma.booking.findMany({
            where: {
              status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
              scheduledClass: {
                storeId,
                startTime: { gte: weekStart },
              },
            },
            select: { clientProfileId: true },
            distinct: ['clientProfileId'],
          }),
          // 该门店客户总课时余额
          prisma.creditAccount.aggregate({
            where: {
              isActive: true,
              remainingCredits: { gt: 0 },
              clientProfile: {
                bookings: {
                  some: {
                    scheduledClass: { storeId },
                  },
                },
              },
            },
            _sum: { remainingCredits: true },
          }),
        ])

      return NextResponse.json({
        data: {
          role: 'MANAGER',
          storeId,
          todayClassCount,
          todayBookingCount,
          weekActiveClientCount: activeClientsResult.length,
          totalClientCredits: totalCreditsResult._sum.remainingCredits ?? 0,
        },
      })
    }

    // 其他角色（COACH/CLIENT）
    return NextResponse.json({
      data: {
        role: session.role,
        message: '暂无统计数据',
      },
    })
  } catch (error) {
    console.error('GET dashboard error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
