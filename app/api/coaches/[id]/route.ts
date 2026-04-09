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

    const coachProfile = await prisma.coachProfile.update({
      where: { userId: id },
      data: {
        bio: body.bio,
        specialties: body.specialties,
        experience: body.experience,
      },
      include: { user: true },
    })

    return NextResponse.json({ data: coachProfile })
  } catch (error) {
    console.error('PATCH coach error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = await params

    // 软删除：标记用户为不活跃
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('DELETE coach error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
