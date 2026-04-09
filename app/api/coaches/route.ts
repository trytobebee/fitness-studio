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
    const storeId = searchParams.get('storeId')

    const coaches = await prisma.coachProfile.findMany({
      where: storeId
        ? {
            coachStores: {
              some: { storeId, isActive: true },
            },
          }
        : undefined,
      include: {
        user: {
          select: { id: true, name: true, phone: true, isActive: true },
        },
        coachStores: {
          where: { isActive: true },
          include: {
            store: { select: { id: true, name: true, address: true } },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return NextResponse.json({ data: coaches })
  } catch (error) {
    console.error('GET coaches error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
