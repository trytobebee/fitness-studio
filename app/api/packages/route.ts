import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      include: {
        courseType: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: packages })
  } catch (error) {
    console.error('GET packages error:', error)
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
    const { name, courseTypeId, credits, price, validDays, description } = body

    if (!name || credits === undefined || price === undefined) {
      return NextResponse.json({ error: '套餐名称、课时数、价格不能为空' }, { status: 400 })
    }

    if (courseTypeId) {
      const courseType = await prisma.courseType.findUnique({ where: { id: courseTypeId } })
      if (!courseType) {
        return NextResponse.json({ error: '课程类型不存在' }, { status: 404 })
      }
    }

    const pkg = await prisma.creditPackage.create({
      data: {
        name,
        courseTypeId: courseTypeId ?? null,
        credits,
        price,
        validDays: validDays ?? null,
        description,
      },
      include: {
        courseType: { select: { id: true, name: true, color: true } },
      },
    })

    return NextResponse.json({ data: pkg }, { status: 201 })
  } catch (error) {
    console.error('POST packages error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
