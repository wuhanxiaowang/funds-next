import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(req) {
  if (!supabase) return NextResponse.json([], { status: 200 })
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get('skip') || '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const { data, error } = await supabase.from('asset_classes').select('*').order('created_at', { ascending: false }).range(skip, skip + limit - 1)
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req) {
  if (!supabase) return NextResponse.json({ detail: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('asset_classes').insert({
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
    }).select().single()
    if (error) return NextResponse.json({ detail: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ detail: e.message || 'Bad request' }, { status: 400 })
  }
}

export async function PUT(req) {
  if (!supabase) return NextResponse.json({ detail: 'Supabase not configured' }, { status: 503 })
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0', 10)
    if (!id) return NextResponse.json({ detail: 'ID required' }, { status: 400 })
    const body = await req.json()
    const { data, error } = await supabase.from('asset_classes').update({
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ detail: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ detail: e.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req) {
  if (!supabase) return NextResponse.json({ detail: 'Supabase not configured' }, { status: 503 })
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '0', 10)
    if (!id) return NextResponse.json({ detail: 'ID required' }, { status: 400 })
    const { error } = await supabase.from('asset_classes').delete().eq('id', id)
    if (error) return NextResponse.json({ detail: error.message }, { status: 400 })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (e) {
    return NextResponse.json({ detail: e.message || 'Bad request' }, { status: 400 })
  }
}