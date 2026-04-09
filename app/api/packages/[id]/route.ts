import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const pkg = await prisma.creditPackage.update({
      where: { id },
      data: {
        name: body.name,
        credits: body.credits !== undefined ? Number(body.credits) : undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        validDays: body.validDays,
        courseTypeId: body.courseTypeId ?? null,
        description: body.description,
        isActive: body.isActive,
      },
      include: { courseType: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ data: pkg })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
