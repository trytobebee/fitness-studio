import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 pt-4 pb-2', className)}>{children}</div>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 pb-4', className)}>{children}</div>
}
