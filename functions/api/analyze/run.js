import { jsonResponse, corsPreflight } from '../../_shared/supabase.js'

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestPost(context) {
  const url = new URL(context.request.url)
  const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '1', 10), 30)
  try {
    const baseUrl = context.env.APP_URL || context.env.NEXT_PUBLIC_APP_URL || ''
    if (!baseUrl) {
      return jsonResponse(
        { ok: false, message: '边缘函数未实现完整分析流程，请配置 APP_URL 指向可执行 /api/analyze/run 的 Node 服务，或使用 Vercel 部署' },
        501
      )
    }
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/analyze/run?page_size=${pageSize}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return jsonResponse(data || { message: 'Upstream run failed' }, res.status)
    return jsonResponse(data)
  } catch (e) {
    return jsonResponse({ ok: false, message: '分析启动失败: ' + (e.message || '') }, 500)
  }
}
