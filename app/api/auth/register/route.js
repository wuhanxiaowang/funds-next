import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { hashPassword, generateToken } from '../../../../lib/auth'

export const runtime = 'nodejs'

export async function POST(req) {
  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }

  try {
    const { email, username, password, code } = await req.json()

    if (!email || !username || !password || !code) {
      return NextResponse.json({ detail: '请填写完整信息' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ detail: '邮箱格式不正确' }, { status: 400 })
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ detail: '用户名长度需在2-20个字符之间' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ detail: '密码长度至少为6位' }, { status: 400 })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ detail: '该邮箱已被注册' }, { status: 400 })
    }

    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUsername) {
      return NextResponse.json({ detail: '该用户名已被使用' }, { status: 400 })
    }

    const { data: verification } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('purpose', 'register')
      .gte('expires_at', new Date().toISOString())
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!verification) {
      return NextResponse.json({ detail: '验证码无效或已过期' }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        username,
        password_hash: passwordHash,
        role: 'vip',
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    await supabase
      .from('email_verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verification.id)

    const token = await generateToken(newUser)

    return NextResponse.json({
      message: '注册成功',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    })
  } catch (e) {
    console.error('注册错误:', e)
    return NextResponse.json({ detail: e.message || '服务器错误' }, { status: 500 })
  }
}
