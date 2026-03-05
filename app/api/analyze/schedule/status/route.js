import { NextResponse } from 'next/server'
import { getScheduleEnabled } from '../../../../../lib/schedule-state'

export const dynamic = 'force-dynamic'

export async function GET() {
  const scheduleEnabled = getScheduleEnabled()
  return NextResponse.json({ enabled: scheduleEnabled, message: scheduleEnabled ? '定时分析运行中' : '未启动' })
}
