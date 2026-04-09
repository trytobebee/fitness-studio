import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courseType = await prisma.courseType.findUnique({ where: { id } })
    if (!courseType) {
      return NextResponse.json({ error: '课程类型不存在' }, { status: 404 })
    }
    return NextResponse.json({ data: courseType })
  } catch (error) {
    console.error('GET course-type error:', error)
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
    const body = await request.json()
    const { name, description, color, duration, maxCapacity, isActive } = body

    const existing = await prisma.courseType.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '课程类型不存在' }, { status: 404 })
    }

    const updated = await prisma.courseType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(duration !== undefined && { duration }),
        ...(maxCapacity !== undefined && { maxCapacity }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH course-type error:', error)
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
    const existing = await prisma.courseType.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '课程类型不存在' }, { status: 404 })
    }

    const updated = await prisma.courseType.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DELETE course-type error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
