import { NextResponse } from 'next/server'
import { getAuditLogs } from '../../../lib/audit'

// Cloudflare Pages 要求使用 Edge Runtime
export const runtime = 'edge'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    
    const options = {
      limit: parseInt(searchParams.get('limit') || '100', 10),
      type: searchParams.get('type'),
      operation: searchParams.get('operation'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    }

    const result = await getAuditLogs(options)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ logs: result.logs, total: result.total })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
