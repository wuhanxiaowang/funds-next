import { NextResponse } from 'next/server'
import { getNewsScheduleEnabled } from '../../../../../lib/news-schedule-state'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ enabled: getNewsScheduleEnabled() })
}
