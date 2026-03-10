import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-code',
    '/api/news',
    '/api/news/schedule/status',
    '/api/analyze/status',
    '/api/analyze/stats',
    '/api/asset-classes',
    '/_next',
    '/favicon.ico'
  ]

  if (publicPaths.some(path => pathname === path || pathname.startsWith('/_next'))) {
    return NextResponse.next()
  }

  // 从 Authorization header 或 cookie 中获取 token
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    const cookie = request.headers.get('cookie')
    if (cookie) {
      const tokenMatch = cookie.match(/token=([^;]+)/)
      if (tokenMatch) token = tokenMatch[1]
    }
  }

  if (!token) {
    if (pathname.startsWith('/api/') && !publicPaths.includes(pathname)) {
      return NextResponse.json({ detail: '请先登录' }, { status: 401 })
    }
    if (!pathname.startsWith('/api/') && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (token) {
    const { verifyToken } = await import('./lib/auth')
    const payload = await verifyToken(token)
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ detail: '登录已过期，请重新登录' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id.toString())
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-role', payload.role)
    // HTTP 头必须是 ASCII，中文等非 ASCII 用 base64 编码
    const rawName = payload.username ?? ''
    const usernameHeader = /[\u0080-\uFFFF]/.test(rawName)
      ? Buffer.from(rawName, 'utf-8').toString('base64')
      : rawName
    requestHeaders.set('x-user-username', usernameHeader)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth/me|_next/static|_next/image|favicon.ico).*)'
  ]
}
