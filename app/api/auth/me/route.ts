import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        managedStoreId: true,
        managedStore: {
          select: { id: true, name: true, address: true },
        },
        coachProfile: {
          select: {
            id: true,
            specialties: true,
            experience: true,
            bio: true,
          },
        },
        clientProfile: {
          select: { id: true, gender: true, birthday: true },
        },
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 401 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
