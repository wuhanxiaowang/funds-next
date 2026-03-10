import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { generateVerificationCode } from '../../../../lib/auth'
import { sendEmail } from '../../../../lib/email'

export const runtime = 'nodejs'

export async function POST(req) {
  if (!supabase) {
    return NextResponse.json({ detail: '服务暂不可用' }, { status: 503 })
  }

  try {
    const { email, purpose = 'register' } = await req.json()

    if (!email) {
      return NextResponse.json({ detail: '邮箱不能为空' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ detail: '邮箱格式不正确' }, { status: 400 })
    }

    if (purpose === 'register') {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return NextResponse.json({ detail: '该邮箱已被注册' }, { status: 400 })
      }
    }

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await supabase
      .from('email_verification_codes')
      .insert({
        email,
        code,
        purpose,
        expires_at: expiresAt
      })

    const emailResult = await sendEmail({
      to: email,
      subject: purpose === 'register' ? '注册验证码' : '重置密码验证码',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${purpose === 'register' ? '注册' : '密码重置'}验证码</h2>
          <p style="color: #666; font-size: 16px;">您的验证码是：</p>
          <p style="font-size: 32px; font-weight: bold; color: #00c3ff; letter-spacing: 4px;">${code}</p>
          <p style="color: #999; font-size: 14px;">验证码有效期为5分钟，请尽快完成验证。</p>
          <p style="color: #ccc; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
        </div>
      `
    })

    if (!emailResult.success) {
      console.error('发送邮件失败:', emailResult.error)
      return NextResponse.json({ detail: '验证码发送失败，请稍后重试' }, { status: 500 })
    }

    return NextResponse.json({ message: '验证码已发送到您的邮箱' })
  } catch (e) {
    console.error('发送验证码错误:', e)
    return NextResponse.json({ detail: e.message || '服务器错误' }, { status: 500 })
  }
}
