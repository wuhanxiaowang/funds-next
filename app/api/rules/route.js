import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const runtime = 'edge'

export async function GET(req) {
  if (!supabase) return NextResponse.json([], { status: 200 })
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get('skip') || '0', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const { data, error } = await supabase.from('rules').select('*').order('created_at', { ascending: false }).range(skip, skip + limit - 1)
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req) {
  if (!supabase) return NextResponse.json({ detail: 'Supabase not configured' }, { status: 503 })
  try {
    const body = await req.json()
    const { data, error } = await supabase.from('rules').insert({
      rule_name: String(body.rule_name || '').trim(),
      keywords: String(body.keywords || '').trim(),
      asset_class: String(body.asset_class || '').trim(),
      operation: String(body.operation || '无操作').trim(),
      threshold: parseInt(body.threshold, 10) || 0,
    }).select().single()
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
    const { error } = await supabase.from('rules').delete().eq('id', id)
    if (error) return NextResponse.json({ detail: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, message: '规则删除成功' })
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
    const { data, error } = await supabase.from('rules')
      .update({
        rule_name: String(body.rule_name || '').trim(),
        keywords: String(body.keywords || '').trim(),
        asset_class: String(body.asset_class || '').trim(),
        operation: String(body.operation || '无操作').trim(),
        threshold: parseInt(body.threshold, 10) || 0,
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) return NextResponse.json({ detail: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ detail: e.message || 'Bad request' }, { status: 400 })
  }
}
