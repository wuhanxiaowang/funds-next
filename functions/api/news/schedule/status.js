import { jsonResponse, corsPreflight } from '../../../_shared/supabase.js'

let newsScheduleEnabled = false
export function getNewsScheduleEnabled() {
  return newsScheduleEnabled
}
export function setNewsScheduleEnabled(v) {
  newsScheduleEnabled = !!v
}

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestGet() {
  return jsonResponse({ enabled: getNewsScheduleEnabled() })
}
