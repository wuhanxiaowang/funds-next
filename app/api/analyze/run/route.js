import { NextResponse } from 'next/server'
import { runAnalysis } from '../../../../lib/pipeline'
import { logAudit, AUDIT_TYPES, AUDIT_OPERATIONS } from '../../../../lib/audit'

// 腾讯云 Docker/Node 部署使用 Node 运行时；Edge 在 standalone 下可能异常
export const runtime = 'nodejs'

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
