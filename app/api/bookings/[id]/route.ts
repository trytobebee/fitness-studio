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
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        clientProfile: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        scheduledClass: {
          include: {
            courseType: true,
            store: true,
            coach: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: '预约不存在' }, { status: 404 })
    }

    return NextResponse.json({ data: booking })
  } catch (error) {
    console.error('GET booking error:', error)
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

    const { id } = await params
    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '预约不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH booking error:', error)
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

    const { id } = await params

    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { scheduledClass: true },
      })

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND')
      }
      if (booking.status === 'CANCELLED') {
        throw new Error('ALREADY_CANCELLED')
      }

      // 查找消费流水，找到 creditAccountId
      const consumeTransaction = await tx.creditTransaction.findFirst({
        where: { bookingId: id, type: 'CONSUME' },
      })

      if (consumeTransaction) {
        // 退还课时
        const updatedAccount = await tx.creditAccount.update({
          where: { id: consumeTransaction.creditAccountId },
          data: {
            usedCredits: { decrement: 1 },
            remainingCredits: { increment: 1 },
          },
        })

        // 创建 REFUND 流水
        await tx.creditTransaction.create({
          data: {
            creditAccountId: consumeTransaction.creditAccountId,
            bookingId: id,
            type: 'REFUND',
            amount: 1,
            balanceAfter: updatedAccount.remainingCredits,
            operatorId: session.userId,
            note: '取消预约退还课时',
          },
        })
      }

      // 更新预约状态
      await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: '用户取消',
        },
      })

      // 如果课程是 FULL，改回 OPEN
      if (booking.scheduledClass.status === 'FULL') {
        await tx.scheduledClass.update({
          where: { id: booking.scheduledClassId },
          data: { status: 'OPEN' },
        })
      }
    })

    return NextResponse.json({ data: { message: '预约已取消，课时已退还' } })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BOOKING_NOT_FOUND') {
        return NextResponse.json({ error: '预约不存在' }, { status: 404 })
      }
      if (error.message === 'ALREADY_CANCELLED') {
        return NextResponse.json({ error: '预约已取消' }, { status: 400 })
      }
    }
    console.error('DELETE booking error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
