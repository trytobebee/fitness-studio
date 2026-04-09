import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await params
    const client = await prisma.clientProfile.findUnique({ where: { id } })
    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    const creditAccounts = await prisma.creditAccount.findMany({
      where: { clientProfileId: id },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            credits: true,
            price: true,
            validDays: true,
            courseType: { select: { id: true, name: true, color: true } },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    })

    return NextResponse.json({ data: creditAccounts })
  } catch (error) {
    console.error('GET credits error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(
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
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json({ error: '套餐ID不能为空' }, { status: 400 })
    }

    const client = await prisma.clientProfile.findUnique({ where: { id } })
    if (!client) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } })
    if (!pkg) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 404 })
    }
    if (!pkg.isActive) {
      return NextResponse.json({ error: '套餐已下架' }, { status: 400 })
    }

    const expiresAt = pkg.validDays
      ? new Date(Date.now() + pkg.validDays * 24 * 60 * 60 * 1000)
      : null

    const creditAccount = await prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.create({
        data: {
          clientProfileId: id,
          packageId: pkg.id,
          totalCredits: pkg.credits,
          usedCredits: 0,
          remainingCredits: pkg.credits,
          expiresAt,
        },
      })

      await tx.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          type: 'PURCHASE',
          amount: pkg.credits,
          balanceAfter: pkg.credits,
          operatorId: session.userId,
          note: `购买套餐：${pkg.name}`,
        },
      })

      return account
    })

    const result = await prisma.creditAccount.findUnique({
      where: { id: creditAccount.id },
      include: {
        package: { select: { id: true, name: true, credits: true } },
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('POST credits error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
