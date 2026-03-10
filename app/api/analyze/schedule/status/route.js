import { NextResponse } from 'next/server'
import * as analysisConfig from '../../../../../lib/analysis-schedule-config'
import { getScheduleEnabled } from '../../../../../lib/schedule-state'
import { cronService } from '../../../../../lib/cron-service'

export const runtime = 'nodejs'

export async function GET() {
  const enabled = getScheduleEnabled()
  const intervalMinutes = analysisConfig.getIntervalMinutes()
  const { nextAnalysisTime } = cronService.getNextTimes()
  return NextResponse.json({
    enabled,
    intervalMinutes,
    nextAnalysisTime: nextAnalysisTime ? nextAnalysisTime.toISOString() : null,
    intervalOptions: analysisConfig.INTERVAL_OPTIONS,
    message: enabled ? '定时分析运行中' : '未启动'
  })
}
