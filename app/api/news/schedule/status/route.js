import { NextResponse } from 'next/server'
import * as newsConfig from '../../../../../lib/news-schedule-config'
import { getNewsScheduleEnabled } from '../../../../../lib/news-schedule-state'
import { cronService } from '../../../../../lib/cron-service'

export const runtime = 'nodejs'

export async function GET() {
  const enabled = getNewsScheduleEnabled()
  const intervalMinutes = newsConfig.getIntervalMinutes()
  const { nextNewsTime } = cronService.getNextTimes()
  return NextResponse.json({
    enabled,
    intervalMinutes,
    nextNewsTime: nextNewsTime ? nextNewsTime.toISOString() : null,
    intervalOptions: newsConfig.INTERVAL_OPTIONS
  })
}
