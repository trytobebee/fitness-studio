import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { LogoutButton } from './LogoutButton'
import { IOSInstallGuide } from '@/components/ui/IOSInstallGuide'

const ROLE_LABELS: Record<string, { label: string; variant: 'purple' | 'success' | 'info' | 'warning' }> = {
  SUPER_ADMIN: { label: '超级管理员', variant: 'purple' },
  MANAGER: { label: '门店管理员', variant: 'warning' },
  COACH: { label: '教练', variant: 'success' },
  CLIENT: { label: '会员', variant: 'info' },
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const role = ROLE_LABELS[session.role] || { label: session.role, variant: 'info' as const }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="我的" />
      <IOSInstallGuide />

      <div className="px-4 py-4 space-y-4 mb-nav">
        {/* 头像和基本信息 */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">{session.name.charAt(0)}</span>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">{session.name}</h2>
                <Badge variant={role.variant} className="mt-2">{role.label}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账户信息 */}
        <Card>
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-900">账户信息</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500">用户ID</span>
              <span className="text-sm text-gray-700 font-mono">{session.userId.slice(-8)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500">角色</span>
              <Badge variant={role.variant}>{role.label}</Badge>
            </div>
          </div>
        </Card>

        {/* 退出登录 */}
        <LogoutButton />

        {/* 版本信息 */}
        <p className="text-center text-xs text-gray-400 py-2">健身管理系统 v1.0.0</p>
      </div>
    </div>
  )
}
