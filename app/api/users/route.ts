import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, password, role } = body

    if (!name || !phone || !password) {
      return NextResponse.json({ error: '姓名、手机号、密码为必填项' }, { status: 400 })
    }

    // 检查手机号是否已存在
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: '手机号已被使用' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role: role || 'COACH',
      },
    })

    // 如果是教练，创建教练档案
    if (role === 'COACH' || !role) {
      await prisma.coachProfile.create({
        data: { userId: user.id },
      })
    }
    // 如果是客户，创建客户档案
    if (role === 'CLIENT') {
      await prisma.clientProfile.create({
        data: { userId: user.id },
      })
    }

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('POST users error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
