import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    console.log('开始查询门店...')
    const stores = await prisma.store.findMany({
      include: {
        managers: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    console.log('门店查询完成，数量:', stores.length)

    // 分别查询每个门店的课程数量
    const storesWithCount = await Promise.all(
      stores.map(async (store) => {
        const count = await prisma.scheduledClass.count({
          where: {
            storeId: store.id,
            startTime: {
              gte: new Date(new Date().toDateString()),
              lt: new Date(new Date(new Date().getTime() + 86400000).toDateString()),
            },
          },
        })
        return {
          ...store,
          _count: { scheduledClasses: count },
        }
      })
    )

    return NextResponse.json({ data: storesWithCount })
  } catch (error) {
    console.error('GET stores error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, latitude, longitude } = body

    if (!name || !address) {
      return NextResponse.json({ error: '门店名称和地址不能为空' }, { status: 400 })
    }

    const store = await prisma.store.create({
      data: { name, address, phone, latitude, longitude },
    })

    return NextResponse.json({ data: store }, { status: 201 })
  } catch (error) {
    console.error('POST stores error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
