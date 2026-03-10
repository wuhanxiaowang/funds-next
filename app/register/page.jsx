'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../components/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (user) {
      router.push('/monitor')
    }
  }, [user, router])

  const sendCode = async () => {
    if (!email) {
      setError('请先输入邮箱')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('邮箱格式不正确')
      return
    }

    setSendingCode(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register' })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || '发送失败')
        return
      }

      setStep(2)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (e) {
      setError('网络错误，请稍后重试')
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少为6位')
      return
    }

    if (!code || code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, code })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || '注册失败')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // 将token存储到cookie中，以便中间件能够获取到
      document.cookie = `token=${data.token}; path=/; max-age=604800; HttpOnly`
      
      // 调用AuthContext中的login函数更新用户状态
      login(data.token, data.user)
      
      router.push('/monitor')
      router.refresh()
    } catch (e) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '60px 20px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 柔和光晕效果 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 150, 200, 0.15) 0%, transparent 70%)',
        zIndex: 0
      }} />
      
      {/* 底部渐变光 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(to top, rgba(0, 100, 150, 0.1), transparent)',
        zIndex: 0
      }} />

      <style>{`
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 30px rgba(0, 195, 255, 0.5), 0 0 60px rgba(0, 150, 200, 0.3); }
          50% { text-shadow: 0 0 40px rgba(0, 195, 255, 0.7), 0 0 80px rgba(0, 150, 200, 0.5); }
        }
      `}</style>

      {/* 系统标题 */}
      <h1 style={{
        textAlign: 'center',
        marginBottom: '60px',
        marginTop: '40px',
        fontSize: '52px',
        fontWeight: '800',
        color: '#e0f7ff',
        letterSpacing: '4px',
        textShadow: '0 0 30px rgba(0, 195, 255, 0.5), 0 0 60px rgba(0, 150, 200, 0.3)',
        animation: 'glow 4s infinite ease-in-out',
        zIndex: 10
      }}>投资信号系统</h1>

      {/* 注册框 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* 注册标题 */}
        <div style={{
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '30px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(0, 195, 255, 0.3)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#e0f7ff',
            letterSpacing: '2px'
          }}>注册</h2>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 77, 79, 0.1)',
            border: '1px solid rgba(255, 77, 79, 0.3)',
            color: '#ff4d4f',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 8px rgba(255, 77, 79, 0.1)'
          }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(224, 247, 255, 0.7)', 
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: '#e0f7ff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s',
                  minHeight: '48px'
                }}
                placeholder="请输入邮箱"
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 195, 255, 0.5)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.target.style.boxShadow = '0 0 12px rgba(0, 195, 255, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.2)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={sendingCode}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                color: '#0a1628',
                fontSize: '16px',
                fontWeight: '700',
                cursor: sendingCode ? 'not-allowed' : 'pointer',
                opacity: sendingCode ? 0.6 : 1,
                marginBottom: '20px',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s',
                minHeight: '52px',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                if (!sendingCode) {
                  e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.6)'
                  e.target.style.transform = 'translateY(-3px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!sendingCode) {
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)'
                  e.target.style.transform = 'translateY(0)'
                }
              }}
            >
              {sendingCode ? '发送中...' : '获取验证码'}
            </button>

            <p style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 215, 0, 0.6)', 
              fontSize: '14px',
              lineHeight: '1.8',
              fontWeight: '500'
            }}>
              已有账号？{' '}
              <Link 
                href="/login" 
                style={{ 
                  color: '#ffd700', 
                  textDecoration: 'none',
                  fontWeight: '700',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.textShadow = 'none'
                }}
              >
                立即登录
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 215, 0, 0.8)', 
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                邮箱
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'rgba(255, 215, 0, 0.5)',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  minHeight: '48px',
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 215, 0, 0.8)', 
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                验证码
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s',
                    minHeight: '48px',
                    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  placeholder="请输入6位验证码"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ffd700'
                    e.target.style.background = 'rgba(0, 0, 0, 0.7)'
                    e.target.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)'
                    e.target.style.background = 'rgba(0, 0, 0, 0.6)'
                    e.target.style.boxShadow = 'inset 0 2px 6px rgba(0, 0, 0, 0.3)'
                  }}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={countdown > 0}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    color: '#0a1628',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (countdown === 0) {
                      e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.5)'
                      e.target.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  {countdown > 0 ? `${countdown}s` : '重新发送'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 215, 0, 0.8)', 
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s',
                  minHeight: '48px',
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)'
                }}
                placeholder="请输入用户名"
                onFocus={(e) => {
                  e.target.style.borderColor = '#ffd700'
                  e.target.style.background = 'rgba(0, 0, 0, 0.7)'
                  e.target.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.3)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.6)'
                  e.target.style.boxShadow = 'inset 0 2px 6px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 215, 0, 0.8)', 
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  color: '#0a1628',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s',
                  minHeight: '48px',
                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
                }}
                placeholder="请输入密码（至少6位）"
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.5)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 215, 0, 0.8)', 
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  color: '#0a1628',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s',
                  minHeight: '48px',
                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
                }}
                placeholder="请再次输入密码"
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.5)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                color: '#0a1628',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: '20px',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s',
                minHeight: '52px',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.6)'
                  e.target.style.transform = 'translateY(-3px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)'
                  e.target.style.transform = 'translateY(0)'
                }
              }}
            >
              {loading ? '注册中...' : '注册'}
            </button>

            <p style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 215, 0, 0.6)', 
              fontSize: '14px',
              lineHeight: '1.8',
              fontWeight: '500'
            }}>
              已有账号？{' '}
              <Link 
                href="/login" 
                style={{ 
                  color: '#ffd700', 
                  textDecoration: 'none',
                  fontWeight: '700',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.textShadow = 'none'
                }}
              >
                立即登录
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
