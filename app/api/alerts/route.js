import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(req) {
  if (!supabase) return NextResponse.json([], { status: 200 })
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get('skip') || '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const { data, error } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).range(skip, skip + limit - 1)
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
