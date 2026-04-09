import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login']

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  MANAGER: '/manager',
  COACH: '/coach',
  CLIENT: '/client',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静态资源和 API 不走中间件权限（API 路由自行鉴权）
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value
  const session = token ? await verifyToken(token) : null

  // 未登录 → 重定向到登录页
  if (!session) {
    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录访问登录页 → 重定向到对应首页
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? '/login', request.url))
  }

  // 路径权限控制
  if (pathname.startsWith('/admin') && session.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? '/login', request.url))
  }
  if (pathname.startsWith('/manager') && !['MANAGER', 'SUPER_ADMIN'].includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? '/login', request.url))
  }
  if (pathname.startsWith('/coach') && !['COACH', 'MANAGER', 'SUPER_ADMIN'].includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? '/login', request.url))
  }
  if (pathname.startsWith('/client') && session.role !== 'CLIENT') {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? '/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
