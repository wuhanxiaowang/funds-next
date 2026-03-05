import { NextResponse } from 'next/server'
import { setNewsScheduleEnabled } from '../../../../../lib/news-schedule-state'

export const dynamic = 'force-dynamic'

export async function POST() {
  setNewsScheduleEnabled(true)
  return NextResponse.json({ ok: true, message: '已启动定时拉取新闻（当前为内存状态，重启后失效）' })
}
