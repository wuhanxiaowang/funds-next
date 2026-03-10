import { NextResponse } from 'next/server'
import * as newsConfig from '../../../../../lib/news-schedule-config'
import { cronService } from '../../../../../lib/cron-service'

export const runtime = 'nodejs'

/** PUT：仅更新间隔（分钟），立即生效 */
export async function PUT(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const intervalMinutes = body.intervalMinutes != null
      ? newsConfig.setIntervalMinutes(body.intervalMinutes)
      : newsConfig.getIntervalMinutes()
    cronService.restartNewsTimer()
    return NextResponse.json({ ok: true, intervalMinutes })
  } catch (e) {
    console.error('更新定时拉取间隔失败:', e)
    return NextResponse.json({ detail: e?.message || '更新失败' }, { status: 500 })
  }
}
