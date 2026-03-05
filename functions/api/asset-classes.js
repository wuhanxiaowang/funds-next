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
      .from('asset_classes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)
    if (error) return errorResponse(error.message, 500)
    return jsonResponse(data || [])
  } catch (e) {
    return errorResponse(e.message || 'Internal error', 500)
  }
}

export async function onRequestPost(context) {
  const supabase = createSupabase(context.env)
  if (!supabase) return errorResponse('Supabase not configured', 503)
  try {
    const body = await context.request.json()
    const { data, error } = await supabase
      .from('asset_classes')
      .insert({
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim(),
      })
      .select()
      .single()
    if (error) return errorResponse(error.message, 400)
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(e.message || 'Bad request', 400)
  }
}

export async function onRequestPut(context) {
  const supabase = createSupabase(context.env)
  if (!supabase) return errorResponse('Supabase not configured', 503)
  try {
    const url = new URL(context.request.url)
    const id = parseInt(url.searchParams.get('id') || '0', 10)
    if (!id) return errorResponse('ID required', 400)
    const body = await context.request.json()
    const { data, error } = await supabase
      .from('asset_classes')
      .update({
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) return errorResponse(error.message, 400)
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(e.message || 'Bad request', 400)
  }
}

export async function onRequestDelete(context) {
  const supabase = createSupabase(context.env)
  if (!supabase) return errorResponse('Supabase not configured', 503)
  try {
    const url = new URL(context.request.url)
    const id = parseInt(url.searchParams.get('id') || '0', 10)
    if (!id) return errorResponse('ID required', 400)
    const { error } = await supabase.from('asset_classes').delete().eq('id', id)
    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ message: 'Deleted successfully' })
  } catch (e) {
    return errorResponse(e.message || 'Bad request', 400)
  }
}
