import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('开始 seed 数据...')

  // ==================== 清理旧数据 ====================
  await prisma.creditTransaction.deleteMany()
  await prisma.creditAccount.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.scheduledClass.deleteMany()
  await prisma.coachStore.deleteMany()
  await prisma.coachProfile.deleteMany()
  await prisma.clientProfile.deleteMany()
  await prisma.creditPackage.deleteMany()
  await prisma.courseType.deleteMany()
  await prisma.user.deleteMany()
  await prisma.store.deleteMany()

  console.log('旧数据已清理')

  // ==================== 1. 门店 ====================
  const storeChaoyang = await prisma.store.create({
    data: {
      name: '北京朝阳店',
      address: '北京市朝阳区三里屯路19号',
      latitude: 39.9299,
      longitude: 116.4536,
    },
  })
  const storeHaidian = await prisma.store.create({
    data: {
      name: '北京海淀店',
      address: '北京市海淀区中关村大街1号',
      latitude: 39.9896,
      longitude: 116.3261,
    },
  })
  const storeXicheng = await prisma.store.create({
    data: {
      name: '北京西城店',
      address: '北京市西城区西单北大街120号',
      latitude: 39.9164,
      longitude: 116.3640,
    },
  })
  console.log('门店创建完成')

  // ==================== 2. 用户 ====================
  const superAdminHash = await bcrypt.hash('admin123', 10)
  const managerHash = await bcrypt.hash('manager123', 10)
  const coachHash = await bcrypt.hash('coach123', 10)
  const clientHash = await bcrypt.hash('client123', 10)

  // 超管
  await prisma.user.create({
    data: {
      name: '系统管理员',
      phone: '18800000000',
      passwordHash: superAdminHash,
      role: 'SUPER_ADMIN',
    },
  })

  // 门店管理员
  await prisma.user.create({
    data: {
      name: '朝阳店长',
      phone: '18811000001',
      passwordHash: managerHash,
      role: 'MANAGER',
      managedStoreId: storeChaoyang.id,
    },
  })
  await prisma.user.create({
    data: {
      name: '海淀店长',
      phone: '18811000002',
      passwordHash: managerHash,
      role: 'MANAGER',
      managedStoreId: storeHaidian.id,
    },
  })
  await prisma.user.create({
    data: {
      name: '西城店长',
      phone: '18811000003',
      passwordHash: managerHash,
      role: 'MANAGER',
      managedStoreId: storeXicheng.id,
    },
  })

  // 教练
  const coachUserZhangWei = await prisma.user.create({
    data: { name: '张伟', phone: '18822000001', passwordHash: coachHash, role: 'COACH' },
  })
  const coachUserWangFang = await prisma.user.create({
    data: { name: '王芳', phone: '18822000002', passwordHash: coachHash, role: 'COACH' },
  })
  const coachUserLiMing = await prisma.user.create({
    data: { name: '李明', phone: '18822000003', passwordHash: coachHash, role: 'COACH' },
  })
  const coachUserChenJing = await prisma.user.create({
    data: { name: '陈静', phone: '18822000004', passwordHash: coachHash, role: 'COACH' },
  })
  const coachUserLiuYang = await prisma.user.create({
    data: { name: '刘洋', phone: '18822000005', passwordHash: coachHash, role: 'COACH' },
  })

  // 客户
  const clientUserZhaoXue = await prisma.user.create({
    data: { name: '赵雪', phone: '18833000001', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserQianDuoDuo = await prisma.user.create({
    data: { name: '钱多多', phone: '18833000002', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserSunLi = await prisma.user.create({
    data: { name: '孙丽', phone: '18833000003', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserLiQiang = await prisma.user.create({
    data: { name: '李强', phone: '18833000004', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserZhouMei = await prisma.user.create({
    data: { name: '周梅', phone: '18833000005', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserWuGang = await prisma.user.create({
    data: { name: '吴刚', phone: '18833000006', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserZhengYan = await prisma.user.create({
    data: { name: '郑燕', phone: '18833000007', passwordHash: clientHash, role: 'CLIENT' },
  })
  const clientUserWangLei = await prisma.user.create({
    data: { name: '王磊', phone: '18833000008', passwordHash: clientHash, role: 'CLIENT' },
  })

  console.log('用户创建完成')

  // ==================== 3. 课程种类 ====================
  const courseYoga = await prisma.courseType.create({
    data: { name: '瑜伽基础', color: '#f59e0b', duration: 60, maxCapacity: 12 },
  })
  const coursePilates = await prisma.courseType.create({
    data: { name: '普拉提', color: '#6366f1', duration: 60, maxCapacity: 8 },
  })
  const courseKickboxing = await prisma.courseType.create({
    data: { name: '搏击有氧', color: '#ef4444', duration: 45, maxCapacity: 15 },
  })
  const courseDance = await prisma.courseType.create({
    data: { name: '舞蹈形体', color: '#ec4899', duration: 60, maxCapacity: 12 },
  })
  const courseMeditation = await prisma.courseType.create({
    data: { name: '冥想放松', color: '#10b981', duration: 45, maxCapacity: 20 },
  })

  console.log('课程种类创建完成')

  // ==================== 4. 教练档案 ====================
  const coachProfileZhangWei = await prisma.coachProfile.create({
    data: {
      userId: coachUserZhangWei.id,
      specialties: '瑜伽基础,冥想放松',
      experience: 5,
      bio: '专注瑜伽教学8年',
    },
  })
  const coachProfileWangFang = await prisma.coachProfile.create({
    data: {
      userId: coachUserWangFang.id,
      specialties: '普拉提,舞蹈形体',
      experience: 4,
      bio: '普拉提认证教练',
    },
  })
  const coachProfileLiMing = await prisma.coachProfile.create({
    data: {
      userId: coachUserLiMing.id,
      specialties: '搏击有氧,瑜伽基础',
      experience: 6,
      bio: '前专业运动员',
    },
  })
  const coachProfileChenJing = await prisma.coachProfile.create({
    data: {
      userId: coachUserChenJing.id,
      specialties: '瑜伽基础,舞蹈形体',
      experience: 3,
    },
  })
  const coachProfileLiuYang = await prisma.coachProfile.create({
    data: {
      userId: coachUserLiuYang.id,
      specialties: '搏击有氧,冥想放松',
      experience: 5,
    },
  })

  console.log('教练档案创建完成')

  // ==================== 5. CoachStore ====================
  // 张伟：朝阳、海淀
  await prisma.coachStore.createMany({
    data: [
      { coachId: coachProfileZhangWei.id, storeId: storeChaoyang.id },
      { coachId: coachProfileZhangWei.id, storeId: storeHaidian.id },
    ],
  })
  // 王芳：朝阳、海淀
  await prisma.coachStore.createMany({
    data: [
      { coachId: coachProfileWangFang.id, storeId: storeChaoyang.id },
      { coachId: coachProfileWangFang.id, storeId: storeHaidian.id },
    ],
  })
  // 李明：所有3个门店
  await prisma.coachStore.createMany({
    data: [
      { coachId: coachProfileLiMing.id, storeId: storeChaoyang.id },
      { coachId: coachProfileLiMing.id, storeId: storeHaidian.id },
      { coachId: coachProfileLiMing.id, storeId: storeXicheng.id },
    ],
  })
  // 陈静：朝阳
  await prisma.coachStore.create({
    data: { coachId: coachProfileChenJing.id, storeId: storeChaoyang.id },
  })
  // 刘洋：海淀、西城
  await prisma.coachStore.createMany({
    data: [
      { coachId: coachProfileLiuYang.id, storeId: storeHaidian.id },
      { coachId: coachProfileLiuYang.id, storeId: storeXicheng.id },
    ],
  })

  console.log('CoachStore 创建完成')

  // ==================== 6. 客户档案 ====================
  const clientProfileZhaoXue = await prisma.clientProfile.create({
    data: { userId: clientUserZhaoXue.id, gender: 'FEMALE' },
  })
  const clientProfileQianDuoDuo = await prisma.clientProfile.create({
    data: { userId: clientUserQianDuoDuo.id, gender: 'FEMALE' },
  })
  const clientProfileSunLi = await prisma.clientProfile.create({
    data: { userId: clientUserSunLi.id, gender: 'FEMALE' },
  })
  const clientProfileLiQiang = await prisma.clientProfile.create({
    data: { userId: clientUserLiQiang.id, gender: 'MALE' },
  })
  const clientProfileZhouMei = await prisma.clientProfile.create({
    data: { userId: clientUserZhouMei.id, gender: 'FEMALE' },
  })
  await prisma.clientProfile.create({
    data: { userId: clientUserWuGang.id, gender: 'MALE' },
  })
  await prisma.clientProfile.create({
    data: { userId: clientUserZhengYan.id, gender: 'FEMALE' },
  })
  await prisma.clientProfile.create({
    data: { userId: clientUserWangLei.id, gender: 'MALE' },
  })

  console.log('客户档案创建完成')

  // ==================== 7. 套餐 ====================
  const packageGeneral10 = await prisma.creditPackage.create({
    data: { name: '通用10课时包', credits: 10, price: 680, validDays: 90 },
  })
  const packageGeneral20 = await prisma.creditPackage.create({
    data: { name: '通用20课时包', credits: 20, price: 1280, validDays: 180 },
  })
  const packageYogaMonthly = await prisma.creditPackage.create({
    data: {
      name: '瑜伽月卡12课时',
      courseTypeId: courseYoga.id,
      credits: 12,
      price: 880,
      validDays: 30,
    },
  })
  const packagePilatesMonthly = await prisma.creditPackage.create({
    data: {
      name: '普拉提月卡8课时',
      courseTypeId: coursePilates.id,
      credits: 8,
      price: 760,
      validDays: 30,
    },
  })

  console.log('套餐创建完成')

  // ==================== 8. 客户课时账户 ====================
  const now = new Date()

  // 赵雪：通用20课时包，已用2课时
  const accountZhaoXue = await prisma.creditAccount.create({
    data: {
      clientProfileId: clientProfileZhaoXue.id,
      packageId: packageGeneral20.id,
      totalCredits: 20,
      usedCredits: 2,
      remainingCredits: 18,
      expiresAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountZhaoXue.id,
      type: 'PURCHASE',
      amount: 20,
      balanceAfter: 20,
      note: '购买通用20课时包',
    },
  })

  // 钱多多：通用10课时包，满额
  const accountQianDuoDuo = await prisma.creditAccount.create({
    data: {
      clientProfileId: clientProfileQianDuoDuo.id,
      packageId: packageGeneral10.id,
      totalCredits: 10,
      usedCredits: 0,
      remainingCredits: 10,
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountQianDuoDuo.id,
      type: 'PURCHASE',
      amount: 10,
      balanceAfter: 10,
      note: '购买通用10课时包',
    },
  })

  // 孙丽：瑜伽月卡，已用4课时
  const accountSunLi = await prisma.creditAccount.create({
    data: {
      clientProfileId: clientProfileSunLi.id,
      packageId: packageYogaMonthly.id,
      totalCredits: 12,
      usedCredits: 4,
      remainingCredits: 8,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountSunLi.id,
      type: 'PURCHASE',
      amount: 12,
      balanceAfter: 12,
      note: '购买瑜伽月卡12课时',
    },
  })

  // 李强：通用10课时包，已用5课时
  const accountLiQiang = await prisma.creditAccount.create({
    data: {
      clientProfileId: clientProfileLiQiang.id,
      packageId: packageGeneral10.id,
      totalCredits: 10,
      usedCredits: 5,
      remainingCredits: 5,
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountLiQiang.id,
      type: 'PURCHASE',
      amount: 10,
      balanceAfter: 10,
      note: '购买通用10课时包',
    },
  })

  // 周梅：通用20课时包，已用5课时
  const accountZhouMei = await prisma.creditAccount.create({
    data: {
      clientProfileId: clientProfileZhouMei.id,
      packageId: packageGeneral20.id,
      totalCredits: 20,
      usedCredits: 5,
      remainingCredits: 15,
      expiresAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountZhouMei.id,
      type: 'PURCHASE',
      amount: 20,
      balanceAfter: 20,
      note: '购买通用20课时包',
    },
  })

  console.log('课时账户创建完成')

  // ==================== 9. 排课（未来14天） ====================
  function getDate(daysFromNow: number, hour: number, minute = 0): Date {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(hour, minute, 0, 0)
    return d
  }
  function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000)
  }

  const scheduledClasses = []

  // 第1天
  const sc1Start = getDate(1, 8)
  const sc1 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseYoga.id,
      coachId: coachProfileZhangWei.id,
      storeId: storeChaoyang.id,
      startTime: sc1Start,
      endTime: addMinutes(sc1Start, courseYoga.duration),
      location: 'A厅',
      maxCapacity: courseYoga.maxCapacity,
    },
  })
  scheduledClasses.push(sc1)

  const sc2Start = getDate(1, 10)
  const sc2 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: coursePilates.id,
      coachId: coachProfileWangFang.id,
      storeId: storeHaidian.id,
      startTime: sc2Start,
      endTime: addMinutes(sc2Start, coursePilates.duration),
      location: 'B厅',
      maxCapacity: coursePilates.maxCapacity,
    },
  })
  scheduledClasses.push(sc2)

  const sc3Start = getDate(1, 19)
  const sc3 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseKickboxing.id,
      coachId: coachProfileLiMing.id,
      storeId: storeXicheng.id,
      startTime: sc3Start,
      endTime: addMinutes(sc3Start, courseKickboxing.duration),
      location: '综合厅',
      maxCapacity: courseKickboxing.maxCapacity,
    },
  })
  scheduledClasses.push(sc3)

  // 第2天
  const sc4Start = getDate(2, 9)
  const sc4 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseDance.id,
      coachId: coachProfileWangFang.id,
      storeId: storeChaoyang.id,
      startTime: sc4Start,
      endTime: addMinutes(sc4Start, courseDance.duration),
      location: 'A厅',
      maxCapacity: courseDance.maxCapacity,
    },
  })
  scheduledClasses.push(sc4)

  const sc5Start = getDate(2, 14)
  const sc5 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseMeditation.id,
      coachId: coachProfileZhangWei.id,
      storeId: storeHaidian.id,
      startTime: sc5Start,
      endTime: addMinutes(sc5Start, courseMeditation.duration),
      location: 'C厅',
      maxCapacity: courseMeditation.maxCapacity,
    },
  })
  scheduledClasses.push(sc5)

  const sc6Start = getDate(2, 18)
  const sc6 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseYoga.id,
      coachId: coachProfileChenJing.id,
      storeId: storeChaoyang.id,
      startTime: sc6Start,
      endTime: addMinutes(sc6Start, courseYoga.duration),
      location: 'A厅',
      maxCapacity: courseYoga.maxCapacity,
    },
  })
  scheduledClasses.push(sc6)

  // 第3天
  const sc7Start = getDate(3, 8)
  const sc7 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseKickboxing.id,
      coachId: coachProfileLiuYang.id,
      storeId: storeXicheng.id,
      startTime: sc7Start,
      endTime: addMinutes(sc7Start, courseKickboxing.duration),
      location: '综合厅',
      maxCapacity: courseKickboxing.maxCapacity,
    },
  })
  scheduledClasses.push(sc7)

  const sc8Start = getDate(3, 11)
  const sc8 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: coursePilates.id,
      coachId: coachProfileWangFang.id,
      storeId: storeHaidian.id,
      startTime: sc8Start,
      endTime: addMinutes(sc8Start, coursePilates.duration),
      location: 'B厅',
      maxCapacity: coursePilates.maxCapacity,
    },
  })
  scheduledClasses.push(sc8)

  const sc9Start = getDate(3, 19, 30)
  const sc9 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseDance.id,
      coachId: coachProfileChenJing.id,
      storeId: storeChaoyang.id,
      startTime: sc9Start,
      endTime: addMinutes(sc9Start, courseDance.duration),
      location: 'A厅',
      maxCapacity: courseDance.maxCapacity,
    },
  })
  scheduledClasses.push(sc9)

  // 第4天
  const sc10Start = getDate(4, 9)
  const sc10 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseYoga.id,
      coachId: coachProfileLiMing.id,
      storeId: storeHaidian.id,
      startTime: sc10Start,
      endTime: addMinutes(sc10Start, courseYoga.duration),
      location: 'B厅',
      maxCapacity: courseYoga.maxCapacity,
    },
  })
  scheduledClasses.push(sc10)

  const sc11Start = getDate(4, 15)
  const sc11 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseMeditation.id,
      coachId: coachProfileLiuYang.id,
      storeId: storeHaidian.id,
      startTime: sc11Start,
      endTime: addMinutes(sc11Start, courseMeditation.duration),
      location: 'C厅',
      maxCapacity: courseMeditation.maxCapacity,
    },
  })
  scheduledClasses.push(sc11)

  // 第5天
  const sc12Start = getDate(5, 8)
  const sc12 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseYoga.id,
      coachId: coachProfileZhangWei.id,
      storeId: storeChaoyang.id,
      startTime: sc12Start,
      endTime: addMinutes(sc12Start, courseYoga.duration),
      location: 'A厅',
      maxCapacity: courseYoga.maxCapacity,
    },
  })
  scheduledClasses.push(sc12)

  const sc13Start = getDate(5, 14)
  const sc13 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseKickboxing.id,
      coachId: coachProfileLiMing.id,
      storeId: storeXicheng.id,
      startTime: sc13Start,
      endTime: addMinutes(sc13Start, courseKickboxing.duration),
      location: '综合厅',
      maxCapacity: courseKickboxing.maxCapacity,
    },
  })
  scheduledClasses.push(sc13)

  const sc14Start = getDate(5, 19)
  const sc14 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: coursePilates.id,
      coachId: coachProfileWangFang.id,
      storeId: storeChaoyang.id,
      startTime: sc14Start,
      endTime: addMinutes(sc14Start, coursePilates.duration),
      location: 'B厅',
      maxCapacity: coursePilates.maxCapacity,
    },
  })
  scheduledClasses.push(sc14)

  // 第6天
  const sc15Start = getDate(6, 10)
  const sc15 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseDance.id,
      coachId: coachProfileChenJing.id,
      storeId: storeChaoyang.id,
      startTime: sc15Start,
      endTime: addMinutes(sc15Start, courseDance.duration),
      location: 'A厅',
      maxCapacity: courseDance.maxCapacity,
    },
  })
  scheduledClasses.push(sc15)

  // 第7天
  const sc16Start = getDate(7, 9)
  const sc16 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseMeditation.id,
      coachId: coachProfileZhangWei.id,
      storeId: storeHaidian.id,
      startTime: sc16Start,
      endTime: addMinutes(sc16Start, courseMeditation.duration),
      location: 'C厅',
      maxCapacity: courseMeditation.maxCapacity,
    },
  })
  scheduledClasses.push(sc16)

  // 第10天
  const sc17Start = getDate(10, 8)
  const sc17 = await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseYoga.id,
      coachId: coachProfileZhangWei.id,
      storeId: storeChaoyang.id,
      startTime: sc17Start,
      endTime: addMinutes(sc17Start, courseYoga.duration),
      location: 'A厅',
      maxCapacity: courseYoga.maxCapacity,
    },
  })
  scheduledClasses.push(sc17)

  // 第14天
  const sc18Start = getDate(14, 19)
  await prisma.scheduledClass.create({
    data: {
      courseTypeId: courseKickboxing.id,
      coachId: coachProfileLiuYang.id,
      storeId: storeXicheng.id,
      startTime: sc18Start,
      endTime: addMinutes(sc18Start, courseKickboxing.duration),
      location: '综合厅',
      maxCapacity: courseKickboxing.maxCapacity,
    },
  })

  console.log('排课创建完成')

  // ==================== 10. 预约 ====================
  // 赵雪：预约3节课（sc1, sc4, sc12）
  const booking1 = await prisma.booking.create({
    data: {
      clientProfileId: clientProfileZhaoXue.id,
      scheduledClassId: sc1.id,
      status: 'CONFIRMED',
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountZhaoXue.id,
      bookingId: booking1.id,
      type: 'CONSUME',
      amount: -1,
      balanceAfter: 19,
      note: '预约课程扣课时',
    },
  })
  await prisma.creditAccount.update({
    where: { id: accountZhaoXue.id },
    data: { usedCredits: { increment: 1 }, remainingCredits: { decrement: 1 } },
  })

  const booking2 = await prisma.booking.create({
    data: {
      clientProfileId: clientProfileZhaoXue.id,
      scheduledClassId: sc4.id,
      status: 'CONFIRMED',
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountZhaoXue.id,
      bookingId: booking2.id,
      type: 'CONSUME',
      amount: -1,
      balanceAfter: 18,
      note: '预约课程扣课时',
    },
  })
  await prisma.creditAccount.update({
    where: { id: accountZhaoXue.id },
    data: { usedCredits: { increment: 1 }, remainingCredits: { decrement: 1 } },
  })

  // 钱多多：预约2节课（sc2, sc5）
  const booking3 = await prisma.booking.create({
    data: {
      clientProfileId: clientProfileQianDuoDuo.id,
      scheduledClassId: sc2.id,
      status: 'CONFIRMED',
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountQianDuoDuo.id,
      bookingId: booking3.id,
      type: 'CONSUME',
      amount: -1,
      balanceAfter: 9,
      note: '预约课程扣课时',
    },
  })
  await prisma.creditAccount.update({
    where: { id: accountQianDuoDuo.id },
    data: { usedCredits: { increment: 1 }, remainingCredits: { decrement: 1 } },
  })

  const booking4 = await prisma.booking.create({
    data: {
      clientProfileId: clientProfileQianDuoDuo.id,
      scheduledClassId: sc5.id,
      status: 'CONFIRMED',
    },
  })
  await prisma.creditTransaction.create({
    data: {
      creditAccountId: accountQianDuoDuo.id,
      bookingId: booking4.id,
      type: 'CONSUME',
      amount: -1,
      balanceAfter: 8,
      note: '预约课程扣课时',
    },
  })
  await prisma.creditAccount.update({
    where: { id: accountQianDuoDuo.id },
    data: { usedCredits: { increment: 1 }, remainingCredits: { decrement: 1 } },
  })

  // 忽略 packagePilatesMonthly 未使用警告（已创建备用）
  void packagePilatesMonthly

  console.log('预约创建完成')
  console.log('Seed 完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
