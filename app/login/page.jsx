'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthContext'
import { getApiUrl } from '../../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { user, login, logout } = useAuth()
  const [email, setEmail] = useState('user@example.com')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    if (!user) {
      setCheckingAuth(false)
      return
    }
    const token = localStorage.getItem('token')
    if (!token) {
      logout()
      setCheckingAuth(false)
      return
    }
    
    const abortController = new AbortController()
    const base = getApiUrl()
    const meUrl = base ? `${base}/api/auth/me` : '/api/auth/me'
    
    fetch(meUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: abortController.signal
    })
      .then(res => {
        if (res.ok) {
          window.location.href = '/monitor'
        } else {
          logout()
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          logout()
        }
      })
      .finally(() => setCheckingAuth(false))
    
    return () => {
      abortController.abort()
    }
  }, [user, logout])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const base = getApiUrl()
      const loginUrl = base ? `${base}/api/auth/login` : '/api/auth/login'
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const text = await res.text()
      let data = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch (_) {
        const msg = res.ok ? '响应格式错误' : (res.status === 404
          ? '登录接口不存在 (404)，请确认已用 npm run dev 启动且未使用错误端口'
          : `请求失败: ${res.status}`)
        setError(msg)
        return
      }

      if (!res.ok) {
        const fallback = res.status === 404
          ? '登录接口未找到 (404)，请检查服务是否正常启动'
          : `登录失败 (${res.status})`
        setError(data.detail ? `${data.detail} (${res.status})` : fallback)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      document.cookie = `token=${data.token}; path=/; max-age=604800`
      login(data.token, data.user)
      
      // 延迟跳转，确保 user 状态已更新
      setTimeout(() => {
        router.push('/monitor')
      }, 50)
    } catch (e) {
      setError(e.message || '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (user && checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)',
        padding: '20px',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '16px'
      }}>
        正在跳转...
      </div>
    )
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
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
          margin-right: 10px;
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

      {/* 登录框 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* 登录标题 */}
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
          }}>登录</h2>
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

        <form onSubmit={handleSubmit}>
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
              disabled={loading}
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
                minHeight: '48px',
                cursor: loading ? 'not-allowed' : 'text',
                opacity: loading ? 0.7 : 1
              }}
              placeholder="默认 user@example.com"
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = 'rgba(0, 195, 255, 0.5)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.target.style.boxShadow = '0 0 12px rgba(0, 195, 255, 0.2)'
                }
              }}
              onBlur={(e) => {
                if (!loading) {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.2)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: 'rgba(224, 247, 255, 0.7)', 
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
              disabled={loading}
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
                minHeight: '48px',
                cursor: loading ? 'not-allowed' : 'text',
                opacity: loading ? 0.7 : 1
              }}
              placeholder="默认 123456"
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = 'rgba(0, 195, 255, 0.5)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.target.style.boxShadow = '0 0 12px rgba(0, 195, 255, 0.2)'
                }
              }}
              onBlur={(e) => {
                if (!loading) {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.2)'
                  e.target.style.boxShadow = 'none'
                }
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
              background: 'linear-gradient(135deg, #00a8cc 0%, #0095ff 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              marginBottom: '20px',
              boxShadow: loading ? '0 4px 15px rgba(0, 149, 255, 0.3)' : '0 4px 15px rgba(0, 149, 255, 0.3)',
              transition: 'all 0.3s',
              minHeight: '52px',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 6px 20px rgba(0, 149, 255, 0.4)'
                e.target.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 4px 15px rgba(0, 149, 255, 0.3)'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {loading && <div className="loading-spinner" />}
            {loading ? '登录中...' : '登录'}
          </button>

          <p style={{ 
            textAlign: 'center', 
            color: 'rgba(224, 247, 255, 0.6)', 
            fontSize: '14px',
            lineHeight: '1.8',
            fontWeight: '500'
          }}>
            还没有账号？{' '}
            <Link 
              href="/register" 
              style={{ 
                color: '#00c3ff', 
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#00e5ff'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#00c3ff'
              }}
            >
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
