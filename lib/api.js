/**
 * 全栈 Next：默认走同源 /api，无需单独后端
 */
export function getApiUrl() {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || ''
  }
  return process.env.NEXT_PUBLIC_API_URL || ''
}

function sanitizeErrorBody(text) {
  if (!text || typeof text !== 'string') return text
  const t = text.trim()
  if (t.startsWith('<') || t.startsWith('<!')) return `接口返回 ${t.length > 80 ? t.slice(0, 80) + '...' : t}（可能是 404 或未配置 NEXT_PUBLIC_API_URL）`
  return t.length > 200 ? t.slice(0, 200) + '...' : t
}

export async function apiGet(path, params = {}) {
  const base = getApiUrl()
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const url = base ? new URL(pathStr, base) : new URL(pathStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(sanitizeErrorBody(body) || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiPost(path, body = null, params = {}) {
  const base = getApiUrl()
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const url = base ? new URL(pathStr, base) : new URL(pathStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(sanitizeErrorBody(body) || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiPut(path, body = null, params = {}) {
  const base = getApiUrl()
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const url = base ? new URL(pathStr, base) : new URL(pathStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(sanitizeErrorBody(body) || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiDelete(path, params = {}) {
  const base = getApiUrl()
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const url = base ? new URL(pathStr, base) : new URL(pathStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(sanitizeErrorBody(body) || `HTTP ${res.status}`)
  }
  return res.json()
}
