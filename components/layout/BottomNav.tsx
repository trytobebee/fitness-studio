'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Users, User, Calendar, CalendarPlus, ClipboardList, BarChart3, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = { href: string; icon: React.ElementType; label: string }

const NAV_CONFIG: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/admin', icon: Home, label: '概览' },
    { href: '/admin/stats', icon: BarChart3, label: '统计' },
    { href: '/admin/stores', icon: Building2, label: '门店' },
    { href: '/profile', icon: User, label: '我的' },
  ],
  MANAGER: [
    { href: '/manager', icon: Home, label: '概览' },
    { href: '/manager/schedule', icon: CalendarDays, label: '排课' },
    { href: '/manager/manage', icon: Users, label: '管理' },
    { href: '/profile', icon: User, label: '我的' },
  ],
  COACH: [
    { href: '/coach', icon: Home, label: '今日' },
    { href: '/coach/schedule', icon: Calendar, label: '课表' },
    { href: '/coach/clients', icon: Users, label: '学员' },
    { href: '/profile', icon: User, label: '我的' },
  ],
  CLIENT: [
    { href: '/client', icon: Home, label: '首页' },
    { href: '/client/book', icon: CalendarPlus, label: '约课' },
    { href: '/client/bookings', icon: ClipboardList, label: '记录' },
    { href: '/profile', icon: User, label: '我的' },
  ],
}

export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const items = NAV_CONFIG[role] || []

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
      <div className="max-w-md mx-auto flex items-center h-16">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/profile'
            ? pathname === '/profile'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              <span className={cn('text-[10px] font-medium', isActive ? 'text-indigo-600' : 'text-gray-400')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
