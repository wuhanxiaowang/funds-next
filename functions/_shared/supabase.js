import { createClient } from '@supabase/supabase-js'

export function createSupabase(env) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS })
}

export function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ detail: message }), { status, headers: CORS_HEADERS })
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
