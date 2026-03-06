import { NextResponse } from 'next/server'
import { setScheduleEnabled } from '../../../../../lib/schedule-state'

export const runtime = 'edge'

export async function POST() {
  setScheduleEnabled(true)
  return NextResponse.json({ ok: true, message: '已启动定时分析（当前为内存状态，重启后失效；可用 Vercel Cron 调用 /api/analyze/run）' })
}
