import { NextResponse } from 'next/server'
import * as analysisConfig from '../../../../../lib/analysis-schedule-config'
import { setScheduleEnabled } from '../../../../../lib/schedule-state'
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
      ? analysisConfig.setIntervalMinutes(body.intervalMinutes)
      : analysisConfig.getIntervalMinutes()
    analysisConfig.setEnabled(true)
    setScheduleEnabled(true)
    cronService.restartAnalysisTimer()
    return NextResponse.json({
      ok: true,
      message: '已启动定时分析（配置已持久化，重启后保持）',
      intervalMinutes
    })
  } catch (e) {
    console.error('启动定时分析失败:', e)
    return NextResponse.json({ detail: e?.message || '启动失败' }, { status: 500 })
  }
}
