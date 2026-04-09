import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  CONFIRMED: { label: '已预约', variant: 'info' },
  CHECKED_IN: { label: '已签到', variant: 'success' },
  COMPLETED: { label: '已完成', variant: 'default' },
  CANCELLED: { label: '已取消', variant: 'danger' },
  NO_SHOW: { label: '未出席', variant: 'warning' },
  OPEN: { label: '开放中', variant: 'success' },
  FULL: { label: '已满员', variant: 'warning' },
  // eslint-disable-next-line camelcase
  CANCELLED_CLASS: { label: '已取消', variant: 'danger' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] || { label: status, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
