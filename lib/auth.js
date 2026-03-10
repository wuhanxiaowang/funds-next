const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

const isEdgeRuntime = typeof crypto === 'undefined' || !crypto.subtle

function base64UrlEncode(data) {
  const json = JSON.stringify(data)
  let base64
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(json, 'utf8').toString('base64')
  } else {
    base64 = btoa(unescape(encodeURIComponent(json)))
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  let decoded
  if (typeof Buffer !== 'undefined') {
    decoded = Buffer.from(str, 'base64').toString('utf8')
  } else {
    decoded = decodeURIComponent(escape(atob(str)))
  }
  return JSON.parse(decoded)
}

async function hmacSignWebCrypto(message, key) {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacSignNodeCrypto(message, key) {
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(key).update(message).digest('base64url')
}

async function hmacSign(message, key) {
  if (isEdgeRuntime) {
    return hmacSignWebCrypto(message, key)
  }
  return hmacSignNodeCrypto(message, key)
}

export async function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  }
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' })
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (7 * 24 * 60 * 60)
  const data = base64UrlEncode({ ...payload, iat: now, exp })
  const signature = await hmacSign(`${header}.${data}`, JWT_SECRET)
  return `${header}.${data}.${signature}`
}

export async function verifyToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, data, signature] = parts
    const expectedSig = await hmacSign(`${header}.${data}`, JWT_SECRET)
    if (signature !== expectedSig) return null
    const payload = base64UrlDecode(data)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch (e) {
    return null
  }
}

export function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/** 从 middleware 设置的 x-user-username 头解码（可能为 base64，用于中文等非 ASCII） */
export function decodeUsernameHeader(value) {
  if (!value || typeof value !== 'string') return ''
  try {
    if (/^[A-Za-z0-9+/]+=*$/.test(value)) {
      const decoded = Buffer.from(value, 'base64').toString('utf-8')
      if (decoded) return decoded
    }
  } catch (_) {}
  return value
}
