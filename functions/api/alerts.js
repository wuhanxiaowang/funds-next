import { createSupabase, jsonResponse, errorResponse, corsPreflight } from '../_shared/supabase.js'

export function onRequestOptions() {
  return corsPreflight()
}

export async function onRequestGet(context) {
  const supabase = createSupabase(context.env)
  if (!supabase) return jsonResponse([], 200)
  try {
    const url = new URL(context.request.url)
    const skip = parseInt(url.searchParams.get('skip') || '0', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500)
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)
    if (error) return errorResponse(error.message, 500)
    return jsonResponse(data || [])
  } catch (e) {
    return errorResponse(e.message || 'Internal error', 500)
  }
}
