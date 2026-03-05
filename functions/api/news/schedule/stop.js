import { jsonResponse, corsPreflight } from '../../../_shared/supabase.js'
import { setNewsScheduleEnabled } from './status.js'

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestPost() {
  setNewsScheduleEnabled(false)
  return jsonResponse({ ok: true, message: '已停止定时拉取新闻' })
}
