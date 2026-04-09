import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await params
    const scheduledClass = await prisma.scheduledClass.findUnique({
      where: { id },
      include: {
        courseType: true,
        coach: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        store: true,
        bookings: {
          include: {
            clientProfile: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!scheduledClass) {
      return NextResponse.json({ error: '排课不存在' }, { status: 404 })
    }

    return NextResponse.json({ data: scheduledClass })
  } catch (error) {
    console.error('GET scheduled-class error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.scheduledClass.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '排课不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { startTime, endTime, location, notes, status, maxCapacity } = body

    const updated = await prisma.scheduledClass.update({
      where: { id },
      data: {
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(maxCapacity !== undefined && { maxCapacity }),
      },
      include: {
        courseType: { select: { id: true, name: true, color: true } },
        coach: { include: { user: { select: { id: true, name: true } } } },
        store: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH scheduled-class error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.scheduledClass.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '排课不存在' }, { status: 404 })
    }
    if (existing.status === 'CANCELLED') {
      return NextResponse.json({ error: '排课已取消' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. 查询所有 CONFIRMED 预约
      const confirmedBookings = await tx.booking.findMany({
        where: {
          scheduledClassId: id,
          status: 'CONFIRMED',
        },
      })

      for (const booking of confirmedBookings) {
        // 2. 查找预约对应的课时流水，找到 creditAccountId
        const consumeTransaction = await tx.creditTransaction.findFirst({
          where: { bookingId: booking.id, type: 'CONSUME' },
        })

        if (consumeTransaction) {
          // 3. 退还课时
          const account = await tx.creditAccount.update({
            where: { id: consumeTransaction.creditAccountId },
            data: {
              usedCredits: { decrement: 1 },
              remainingCredits: { increment: 1 },
            },
          })

          // 4. 创建 REFUND 流水
          await tx.creditTransaction.create({
            data: {
              creditAccountId: consumeTransaction.creditAccountId,
              bookingId: booking.id,
              type: 'REFUND',
              amount: 1,
              balanceAfter: account.remainingCredits,
              operatorId: session.userId,
              note: '排课取消退还课时',
            },
          })
        }

        // 5. 取消预约
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: '排课取消' },
        })
      }

      // 6. 取消排课
      await tx.scheduledClass.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
    })

    return NextResponse.json({ data: { message: '排课已取消，相关预约已退课时' } })
  } catch (error) {
    console.error('DELETE scheduled-class error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
