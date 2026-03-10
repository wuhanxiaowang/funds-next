import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { PERMISSIONS } from '../../../../lib/permissions'

export const runtime = 'nodejs'

const CONFIG_KEY = 'menu_permissions'

/** GET：获取菜单权限配置（只读，用于前端展示与 hasPermission） */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ permissions: PERMISSIONS })
  }
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single()
    if (error || !data?.value) {
      return NextResponse.json({ permissions: PERMISSIONS })
    }
    return NextResponse.json({ permissions: data.value })
  } catch (e) {
    console.error('获取菜单权限失败:', e)
    return NextResponse.json({ permissions: PERMISSIONS })
  }
}

/** PUT：更新菜单权限配置（仅 admin） */
export async function PUT(req) {
  const role = req.headers.get('x-user-role')
  if (role !== 'admin') {
    return NextResponse.json({ detail: '仅管理员可修改' }, { status: 403 })
  }
  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }
  try {
    const { permissions } = await req.json()
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ detail: '参数错误' }, { status: 400 })
    }
    const { error } = await supabase
      .from('system_config')
      .upsert({
        key: CONFIG_KEY,
        value: permissions,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('更新菜单权限失败:', e)
    return NextResponse.json({ detail: e.message || '保存失败' }, { status: 500 })
  }
}
