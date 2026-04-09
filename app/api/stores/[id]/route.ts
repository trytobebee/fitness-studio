import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, address, phone, latitude, longitude } = body

    const store = await prisma.store.update({
      where: { id },
      data: {
        name,
        address,
        phone: phone || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    })

    return NextResponse.json({ data: store })
  } catch (error) {
    console.error('PATCH store error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = await params

    // 软删除：标记为不活跃
    await prisma.store.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('DELETE store error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
