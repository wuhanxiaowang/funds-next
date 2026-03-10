import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { verifyToken } from '../../../../lib/auth'

export const runtime = 'nodejs'

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ detail: 'Token无效或已过期' }, { status: 401 })
  }

  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role, status, last_login_at, created_at')
      .eq('id', payload.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ detail: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (e) {
    console.error('获取用户信息错误:', e)
    return NextResponse.json({ detail: e.message || '服务器错误' }, { status: 500 })
  }
}
