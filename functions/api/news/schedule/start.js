import { jsonResponse, corsPreflight } from '../../../_shared/supabase.js'
import { setNewsScheduleEnabled } from './status.js'

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestPost() {
  setNewsScheduleEnabled(true)
  return jsonResponse({ ok: true, message: '已启动定时拉取新闻（边缘内为内存状态）' })
}
