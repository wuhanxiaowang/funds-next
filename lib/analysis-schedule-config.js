/**
 * 定时分析：可配置间隔 + 持久化到 system_config
 * - intervalMinutes: 执行间隔（分钟），默认 120
 * - enabled: 是否启用，重启后从 DB 恢复
 */

const CONFIG_KEY = 'analysis_schedule'
const DEFAULT_INTERVAL_MINUTES = 120
const MIN_INTERVAL = 5
const MAX_INTERVAL = 60 * 24 // 24 小时

let intervalMinutes = DEFAULT_INTERVAL_MINUTES
let enabled = false
let loaded = false

function getSupabase() {
  try {
    const { supabase } = require('./supabase')
    return supabase
  } catch (_) {
    return null
  }
}

export function getIntervalMinutes() {
  return intervalMinutes
}

export function setIntervalMinutes(min) {
  const n = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, Number(min) || DEFAULT_INTERVAL_MINUTES))
  intervalMinutes = n
  saveToDb().catch(() => {})
  return n
}

export function getEnabled() {
  return enabled
}

export function setEnabled(v) {
  enabled = !!v
  saveToDb().catch(() => {})
  return enabled
}

export async function loadFromDb() {
  const supabase = getSupabase()
  if (!supabase) {
    loaded = true
    return
  }
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single()
    if (!error && data?.value && typeof data.value === 'object') {
      if (typeof data.value.intervalMinutes === 'number') {
        intervalMinutes = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, data.value.intervalMinutes))
      }
      if (typeof data.value.enabled === 'boolean') {
        enabled = data.value.enabled
      }
    }
  } catch (e) {
    console.warn('加载 analysis_schedule 配置失败:', e?.message)
  }
  loaded = true
}

export async function saveToDb() {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase
      .from('system_config')
      .upsert({
        key: CONFIG_KEY,
        value: { intervalMinutes, enabled },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
  } catch (e) {
    console.warn('保存 analysis_schedule 配置失败:', e?.message)
  }
}

export function isLoaded() {
  return loaded
}

export const INTERVAL_OPTIONS = [
  { value: 15, label: '15 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
  { value: 120, label: '2 小时' },
  { value: 240, label: '4 小时' },
  { value: 360, label: '6 小时' },
  { value: 720, label: '12 小时' },
  { value: 1440, label: '24 小时' }
]
