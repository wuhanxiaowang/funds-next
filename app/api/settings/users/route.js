import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export const runtime = 'nodejs'

/** GET：获取用户列表（仅 admin），不含密码 */
export async function GET(req) {
  const role = req.headers.get('x-user-role')
  if (role !== 'admin') {
    return NextResponse.json({ detail: '仅管理员可查看' }, { status: 403 })
  }
  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, role, status, last_login_at, created_at')
      .order('id', { ascending: true })
    if (error) throw error
    return NextResponse.json({ users: data || [] })
  } catch (e) {
    console.error('获取用户列表失败:', e)
    return NextResponse.json({ detail: e.message || '获取失败' }, { status: 500 })
  }
}

const ALLOWED_ROLES = ['admin', 'vip', 'user', 'viewer']

/** PATCH：修改用户角色（仅 admin） */
export async function PATCH(req) {
  const role = req.headers.get('x-user-role')
  if (role !== 'admin') {
    return NextResponse.json({ detail: '仅管理员可修改' }, { status: 403 })
  }
  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const { id: userId, role: newRole } = body
    if (!userId || !newRole || !ALLOWED_ROLES.includes(newRole)) {
      return NextResponse.json({ detail: '参数错误：需要 id 和 role（admin/user/viewer）' }, { status: 400 })
    }
    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('修改用户角色失败:', e)
    return NextResponse.json({ detail: e.message || '修改失败' }, { status: 500 })
  }
}
