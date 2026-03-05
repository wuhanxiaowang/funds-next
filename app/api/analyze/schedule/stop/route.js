import { NextResponse } from 'next/server'
import { setScheduleEnabled } from '../../../../../lib/schedule-state'

export const dynamic = 'force-dynamic'

export async function POST() {
  setScheduleEnabled(false)
  return NextResponse.json({ ok: true, message: '已停止定时分析' })
}
