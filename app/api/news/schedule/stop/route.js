import { NextResponse } from 'next/server'
import { setNewsScheduleEnabled } from '../../../../../lib/news-schedule-state'

export async function POST() {
  setNewsScheduleEnabled(false)
  return NextResponse.json({ ok: true, message: '已停止定时拉取新闻' })
}
