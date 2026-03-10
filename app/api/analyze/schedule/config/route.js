import { NextResponse } from 'next/server'
import * as analysisConfig from '../../../../../../lib/analysis-schedule-config'
import { cronService } from '../../../../../../lib/cron-service'

export const runtime = 'nodejs'

/** PUT：仅更新分析执行间隔（分钟），立即生效 */
export async function PUT(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const intervalMinutes = body.intervalMinutes != null
      ? analysisConfig.setIntervalMinutes(body.intervalMinutes)
      : analysisConfig.getIntervalMinutes()
    cronService.restartAnalysisTimer()
    return NextResponse.json({ ok: true, intervalMinutes })
  } catch (e) {
    console.error('更新定时分析间隔失败:', e)
    return NextResponse.json({ detail: e?.message || '更新失败' }, { status: 500 })
  }
}
