import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientProfileId = searchParams.get('clientProfileId')
    const scheduledClassId = searchParams.get('scheduledClassId')
    const status = searchParams.get('status')
    const coachId = searchParams.get('coachId')

    const bookings = await prisma.booking.findMany({
      where: {
        ...(clientProfileId && { clientProfileId }),
        ...(scheduledClassId && { scheduledClassId }),
        ...(status && { status }),
        ...(coachId && { scheduledClass: { coachId } }),
      },
      include: {
        clientProfile: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        scheduledClass: {
          include: {
            courseType: { select: { id: true, name: true, color: true } },
            store: { select: { id: true, name: true } },
            coach: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: bookings })
  } catch (error) {
    console.error('GET bookings error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduledClassId, clientProfileId } = body

    if (!scheduledClassId || !clientProfileId) {
      return NextResponse.json({ error: 'scheduledClassId 和 clientProfileId 为必填' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. 验证课程状态
      const scheduledClass = await tx.scheduledClass.findUnique({
        where: { id: scheduledClassId },
        include: { _count: { select: { bookings: { where: { status: { not: 'CANCELLED' } } } } } },
      })

      if (!scheduledClass) {
        throw new Error('COURSE_NOT_FOUND')
      }
      if (scheduledClass.status === 'CANCELLED') {
        throw new Error('COURSE_CANCELLED')
      }
      if (scheduledClass.status === 'FULL') {
        throw new Error('COURSE_FULL')
      }

      // 2. 检查容量
      const activeBookingsCount = scheduledClass._count.bookings
      if (activeBookingsCount >= scheduledClass.maxCapacity) {
        throw new Error('COURSE_FULL')
      }

      // 3. 检查是否已预约
      const existingBooking = await tx.booking.findUnique({
        where: { clientProfileId_scheduledClassId: { clientProfileId, scheduledClassId } },
      })
      if (existingBooking && existingBooking.status !== 'CANCELLED') {
        throw new Error('ALREADY_BOOKED')
      }

      // 4. 查找有效课时（余额>0，未过期，按购买时间升序）
      const validAccount = await tx.creditAccount.findFirst({
        where: {
          clientProfileId,
          isActive: true,
          remainingCredits: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          package: {
            OR: [
              { courseTypeId: null },
              { courseTypeId: scheduledClass.courseTypeId },
            ],
          },
        },
        orderBy: { purchasedAt: 'asc' },
      })

      if (!validAccount) {
        throw new Error('INSUFFICIENT_CREDITS')
      }

      // 5. 创建或更新 Booking
      let booking
      if (existingBooking) {
        booking = await tx.booking.update({
          where: { id: existingBooking.id },
          data: { status: 'CONFIRMED', cancelledAt: null, cancelReason: null, bookedBy: session.userId },
        })
      } else {
        booking = await tx.booking.create({
          data: {
            clientProfileId,
            scheduledClassId,
            status: 'CONFIRMED',
            bookedBy: session.userId,
          },
        })
      }

      // 6. 扣减课时
      const updatedAccount = await tx.creditAccount.update({
        where: { id: validAccount.id },
        data: {
          usedCredits: { increment: 1 },
          remainingCredits: { decrement: 1 },
        },
      })

      // 7. 创建 CONSUME 流水
      await tx.creditTransaction.create({
        data: {
          creditAccountId: validAccount.id,
          bookingId: booking.id,
          type: 'CONSUME',
          amount: -1,
          balanceAfter: updatedAccount.remainingCredits,
          operatorId: session.userId,
          note: '预约课程扣课时',
        },
      })

      // 8. 如果达到上限，更新课程状态为 FULL
      if (activeBookingsCount + 1 >= scheduledClass.maxCapacity) {
        await tx.scheduledClass.update({
          where: { id: scheduledClassId },
          data: { status: 'FULL' },
        })
      }

      return booking
    })

    const booking = await prisma.booking.findUnique({
      where: { id: result.id },
      include: {
        scheduledClass: {
          include: {
            courseType: { select: { id: true, name: true, color: true } },
            store: { select: { id: true, name: true } },
          },
        },
        clientProfile: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json({ data: booking }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      const errorMap: Record<string, [string, number]> = {
        COURSE_NOT_FOUND: ['课程不存在', 404],
        COURSE_CANCELLED: ['课程已取消', 400],
        COURSE_FULL: ['课程已满', 400],
        ALREADY_BOOKED: ['您已预约该课程', 400],
        INSUFFICIENT_CREDITS: ['课时不足，请先购买课时包', 400],
      }
      const mapped = errorMap[error.message]
      if (mapped) {
        return NextResponse.json({ error: mapped[0] }, { status: mapped[1] })
      }
    }
    console.error('POST bookings error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
