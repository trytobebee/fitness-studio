import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="max-w-md mx-auto relative min-h-screen">
      {children}
      <BottomNav role={session.role} />
    </div>
  )
}
