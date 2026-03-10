import { NextResponse } from 'next/server'
import * as newsConfig from '../../../../../lib/news-schedule-config'
import { setNewsScheduleEnabled } from '../../../../../lib/news-schedule-state'
import { cronService } from '../../../../../lib/cron-service'

export const runtime = 'nodejs'

export async function POST() {
  newsConfig.setEnabled(false)
  setNewsScheduleEnabled(false)
  cronService.restartNewsTimer()
  return NextResponse.json({ ok: true, message: '已停止定时拉取新闻（配置已持久化）' })
}
