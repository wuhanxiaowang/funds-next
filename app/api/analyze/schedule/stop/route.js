import { NextResponse } from 'next/server'
import * as analysisConfig from '../../../../../lib/analysis-schedule-config'
import { setScheduleEnabled } from '../../../../../lib/schedule-state'
import { cronService } from '../../../../../lib/cron-service'

export const runtime = 'nodejs'

export async function POST() {
  analysisConfig.setEnabled(false)
  setScheduleEnabled(false)
  cronService.restartAnalysisTimer()
  return NextResponse.json({ ok: true, message: '已停止定时分析（配置已持久化）' })
}
