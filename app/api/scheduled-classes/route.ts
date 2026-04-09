import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// 计算两点之间的距离（km），使用 Haversine 公式
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const storeId = searchParams.get('storeId')
    const coachId = searchParams.get('coachId')
    const courseTypeId = searchParams.get('courseTypeId')
    const status = searchParams.get('status')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate 和 endDate 为必填参数' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const scheduledClasses = await prisma.scheduledClass.findMany({
      where: {
        startTime: { gte: start, lte: end },
        ...(storeId && { storeId }),
        ...(coachId && { coachId }),
        ...(courseTypeId && { courseTypeId }),
        ...(status && { status }),
      },
      include: {
        courseType: { select: { id: true, name: true, color: true, duration: true } },
        coach: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        store: { select: { id: true, name: true, address: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ data: scheduledClasses })
  } catch (error) {
    console.error('GET scheduled-classes error:', error)
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
    const { courseTypeId, coachId, storeId, startTime, endTime, location, maxCapacity, notes } =
      body

    if (!courseTypeId || !coachId || !storeId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'courseTypeId, coachId, storeId, startTime, endTime 为必填' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // 验证课程类型存在
    const courseType = await prisma.courseType.findUnique({ where: { id: courseTypeId } })
    if (!courseType) {
      return NextResponse.json({ error: '课程类型不存在' }, { status: 404 })
    }

    // 验证教练存在
    const coach = await prisma.coachProfile.findUnique({
      where: { id: coachId },
      include: { coachStores: { include: { store: true } } },
    })
    if (!coach) {
      return NextResponse.json({ error: '教练不存在' }, { status: 404 })
    }

    // 验证门店存在
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store) {
      return NextResponse.json({ error: '门店不存在' }, { status: 404 })
    }

    // 检查教练时间冲突（前后2小时内）
    const twoHoursBefore = new Date(start.getTime() - 2 * 60 * 60 * 1000)
    const twoHoursAfter = new Date(end.getTime() + 2 * 60 * 60 * 1000)

    const conflictingClasses = await prisma.scheduledClass.findMany({
      where: {
        coachId,
        status: { not: 'CANCELLED' },
        OR: [
          { startTime: { gte: twoHoursBefore, lte: twoHoursAfter } },
          { endTime: { gte: twoHoursBefore, lte: twoHoursAfter } },
        ],
      },
      include: {
        store: true,
      },
    })

    let warning: string | undefined

    if (conflictingClasses.length > 0) {
      for (const conflict of conflictingClasses) {
        const conflictStore = conflict.store
        if (
          conflictStore.latitude != null &&
          conflictStore.longitude != null &&
          store.latitude != null &&
          store.longitude != null
        ) {
          const distance = calcDistance(
            store.latitude,
            store.longitude,
            conflictStore.latitude,
            conflictStore.longitude
          )
          // 估算行程时间（分钟）：距离/30km*60分钟
          const travelTimeMinutes = (distance / 30) * 60

          // 计算课程间隔（分钟）
          const newEndTime = end.getTime()
          const conflictStartTime = new Date(conflict.startTime).getTime()
          const conflictEndTime = new Date(conflict.endTime).getTime()
          const newStartTime = start.getTime()

          let gapMinutes: number
          if (newEndTime <= conflictStartTime) {
            gapMinutes = (conflictStartTime - newEndTime) / 60000
          } else {
            gapMinutes = (newStartTime - conflictEndTime) / 60000
          }

          if (gapMinutes >= 0 && gapMinutes < travelTimeMinutes) {
            warning = `注意：教练在 ${conflictStore.name} 有相近时间的课程（间隔 ${Math.round(gapMinutes)} 分钟），预计行程需要 ${Math.round(travelTimeMinutes)} 分钟（距离约 ${distance.toFixed(1)} km）`
          }
        }
      }
    }

    const scheduledClass = await prisma.scheduledClass.create({
      data: {
        courseTypeId,
        coachId,
        storeId,
        startTime: start,
        endTime: end,
        location,
        maxCapacity: maxCapacity ?? courseType.maxCapacity,
        notes,
      },
      include: {
        courseType: { select: { id: true, name: true, color: true } },
        coach: { include: { user: { select: { id: true, name: true } } } },
        store: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      { data: scheduledClass, ...(warning && { warning }) },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST scheduled-classes error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
