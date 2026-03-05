import { createSupabase, jsonResponse, corsPreflight } from '../../_shared/supabase.js'

const emptyStats = () => ({ newsCount: 0, signalCount: 0, validSignalCount: 0, alertCount: 0 })

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestGet(context) {
  const supabase = createSupabase(context.env)
  if (!supabase) return jsonResponse(emptyStats(), 200)
  try {
    const today = new Date().toISOString().slice(0, 10)
    const [nRes, sRes, aRes] = await Promise.all([
      supabase.from('news').select('created_at'),
      supabase.from('signals').select('created_at, is_valid'),
      supabase.from('alerts').select('created_at'),
    ])
    const todayNews = (nRes.data || []).filter((i) => i.created_at && i.created_at.startsWith(today))
    const todaySignals = (sRes.data || []).filter((i) => i.created_at && i.created_at.startsWith(today))
    const todayValidSignals = todaySignals.filter((i) => i.is_valid === true)
    const todayAlerts = (aRes.data || []).filter((i) => i.created_at && i.created_at.startsWith(today))
    return jsonResponse({
      newsCount: todayNews.length,
      signalCount: todaySignals.length,
      validSignalCount: todayValidSignals.length,
      alertCount: todayAlerts.length,
    })
  } catch (e) {
    return jsonResponse(emptyStats(), 200)
  }
}
