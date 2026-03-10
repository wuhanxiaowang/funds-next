import { NextResponse } from 'next/server'
import * as newsConfig from '../../../../../lib/news-schedule-config'
import { setNewsScheduleEnabled } from '../../../../../lib/news-schedule-state'
import { cronService } from '../../../../../lib/cron-service'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    let body = {}
    try {
      const text = await req.text()
      if (text) body = JSON.parse(text)
    } catch (_) {}
    const intervalMinutes = body.intervalMinutes != null
      ? newsConfig.setIntervalMinutes(body.intervalMinutes)
      : newsConfig.getIntervalMinutes()
    newsConfig.setEnabled(true)
    setNewsScheduleEnabled(true)
    cronService.restartNewsTimer()
    return NextResponse.json({
      ok: true,
      message: '已启动定时拉取新闻（配置已持久化，重启后保持）',
      intervalMinutes
    })
  } catch (e) {
    console.error('启动定时拉取失败:', e)
    return NextResponse.json({ detail: e?.message || '启动失败' }, { status: 500 })
  }
}
