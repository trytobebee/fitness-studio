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
    const client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, phone: true, isActive: true, createdAt: true },
        },
        creditAccounts: {
          include: {
            package: { select: { id: true, name: true, credits: true, validDays: true } },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
          orderBy: { purchasedAt: 'desc' },
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            scheduledClass: {
              include: {
                courseType: { select: { id: true, name: true, color: true } },
                store: { select: { id: true, name: true } },
                coach: {
                  include: {
                    user: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    return NextResponse.json({ data: client })
  } catch (error) {
    console.error('GET client error:', error)
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
    const existing = await prisma.clientProfile.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!existing) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { name, gender, birthday, notes, isActive } = body

    const [updatedProfile] = await prisma.$transaction([
      prisma.clientProfile.update({
        where: { id },
        data: {
          ...(gender !== undefined && { gender }),
          ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      ...(name !== undefined || isActive !== undefined
        ? [
            prisma.user.update({
              where: { id: existing.userId },
              data: {
                ...(name !== undefined && { name }),
                ...(isActive !== undefined && { isActive }),
              },
            }),
          ]
        : []),
    ])

    return NextResponse.json({ data: updatedProfile })
  } catch (error) {
    console.error('PATCH client error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
