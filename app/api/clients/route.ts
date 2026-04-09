import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'MANAGER' && session.role !== 'COACH') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const clients = await prisma.clientProfile.findMany({
      where: search
        ? {
            user: {
              OR: [
                { name: { contains: search } },
                { phone: { contains: search } },
              ],
            },
          }
        : undefined,
      include: {
        user: {
          select: { id: true, name: true, phone: true, isActive: true, createdAt: true },
        },
        creditAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            remainingCredits: true,
            totalCredits: true,
            usedCredits: true,
            expiresAt: true,
            package: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return NextResponse.json({ data: clients })
  } catch (error) {
    console.error('GET clients error:', error)
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
    const { name, phone, password, gender, birthday, notes } = body

    if (!name || !phone || !password) {
      return NextResponse.json({ error: '姓名、手机号、密码不能为空' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json({ error: '该手机号已注册' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role: 'CLIENT',
        clientProfile: {
          create: {
            gender,
            birthday: birthday ? new Date(birthday) : undefined,
            notes,
          },
        },
      },
      include: {
        clientProfile: true,
      },
    })

    const { passwordHash: _, ...userWithoutPassword } = user
    return NextResponse.json({ data: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error('POST clients error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
