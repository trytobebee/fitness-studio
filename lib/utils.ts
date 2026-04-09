import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm')
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'yyyy-MM-dd')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MM-dd HH:mm')
}

export function formatRelative(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return `今天 ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `明天 ${format(d, 'HH:mm')}`
  return format(d, 'MM月dd日 HH:mm')
}

export function formatRelativeFromNow(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
}

// 计算两个经纬度之间的距离（公里）
export function calcDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 估算行程时间（分钟），按城市平均 30km/h 行驶速度
export function estimateTravelMinutes(distanceKm: number): number {
  return Math.ceil((distanceKm / 30) * 60)
}
