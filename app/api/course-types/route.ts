import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const courseTypes = await prisma.courseType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: courseTypes })
  } catch (error) {
    console.error('GET course-types error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, duration, maxCapacity } = body

    if (!name) {
      return NextResponse.json({ error: '课程名称不能为空' }, { status: 400 })
    }

    const courseType = await prisma.courseType.create({
      data: {
        name,
        description,
        color: color ?? '#6366f1',
        duration: duration ?? 60,
        maxCapacity: maxCapacity ?? 10,
      },
    })

    return NextResponse.json({ data: courseType }, { status: 201 })
  } catch (error) {
    console.error('POST course-types error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
