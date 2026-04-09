import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  MANAGER: '/manager',
  COACH: '/coach',
  CLIENT: '/client',
}

export default async function RootPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  redirect(ROLE_HOME[session.role] ?? '/login')
}
