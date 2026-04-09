import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: '手机号和密码不能为空' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        passwordHash: true,
        role: true,
        isActive: true,
        managedStoreId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      storeId: user.managedStoreId ?? undefined,
    })

    const { passwordHash: _, ...userWithoutPassword } = user
    const response = NextResponse.json({ data: userWithoutPassword })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
