import { jsonResponse, corsPreflight } from '../../../_shared/supabase.js'

let scheduleEnabled = false

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestGet() {
  return jsonResponse({ enabled: scheduleEnabled, message: scheduleEnabled ? '定时分析运行中' : '未启动' })
}

export async function onRequestPost(context) {
  const segment = context.params?.path || ''
  if (segment === 'start') {
    scheduleEnabled = true
    return jsonResponse({ ok: true, message: '已启动定时分析（边缘内为内存状态，可用 Cron 调用 /api/analyze/run）' })
  }
  if (segment === 'stop') {
    scheduleEnabled = false
    return jsonResponse({ ok: true, message: '已停止定时分析' })
  }
  return jsonResponse({ ok: false, message: 'Not found' }, 404)
}
