import { NextResponse } from 'next/server'
import { runAnalysis } from '../../../../lib/pipeline'
import { logAudit, AUDIT_TYPES, AUDIT_OPERATIONS } from '../../../../lib/audit'

// Cloudflare Pages 要求使用 Edge Runtime
export const runtime = 'edge'

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url)
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || '1', 10), 30)
    
    // 记录用户操作审计日志
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    await logAudit(AUDIT_TYPES.USER_ACTION, AUDIT_OPERATIONS.TRIGGER_ANALYSIS, {
      ip,
      user_agent: userAgent,
      page_size: pageSize
    })
    
    // 异步启动分析，不等待完成
    runAnalysis(pageSize).catch(e => console.error('分析任务失败:', e))
    
    // 立即返回，让前端开始轮询状态
    return NextResponse.json({ ok: true, message: '分析任务已启动' })
  } catch (e) {
    return NextResponse.json({ message: '分析失败: ' + (e.message || '') }, { status: 500 })
  }
}
