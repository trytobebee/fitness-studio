import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (session.role !== 'COACH' && session.role !== 'MANAGER' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = await params
    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      return NextResponse.json({ error: '预约不存在' }, { status: 404 })
    }
    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: '预约已取消，无法签到' }, { status: 400 })
    }
    if (booking.status === 'CHECKED_IN') {
      return NextResponse.json({ error: '已签到' }, { status: 400 })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
      include: {
        clientProfile: {
          include: { user: { select: { id: true, name: true } } },
        },
        scheduledClass: {
          include: {
            courseType: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('POST checkin error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
