import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { verifyPassword, generateToken } from '../../../../lib/auth'

export const runtime = 'nodejs'

export async function POST(req) {
  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ detail: '请输入邮箱和密码' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ detail: '邮箱或密码错误' }, { status: 401 })
    }

    if (user.status !== 'active') {
      return NextResponse.json({ detail: '账号已被禁用' }, { status: 401 })
    }

    const isValidPassword = verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ detail: '邮箱或密码错误' }, { status: 401 })
    }

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    const token = await generateToken(user)

    return NextResponse.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    })
  } catch (e) {
    console.error('登录错误:', e)
    return NextResponse.json({ detail: e.message || '服务器错误' }, { status: 500 })
  }
}
