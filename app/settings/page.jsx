'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../components/AuthContext'
import { apiGet, apiPut, apiPatch } from '../../lib/api'
import { PERMISSION_LABELS, ROLE_LABELS } from '../../lib/permissions'

// 添加下拉菜单样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    select {
      /* 基础样式已在组件中定义 */
    }
    
    select option {
      background: rgba(10, 22, 40, 0.95);
      color: #fff;
      padding: 8px 12px;
    }
    
    select option:checked {
      background: rgba(0, 195, 255, 0.25);
      color: #00c3ff;
    }
    
    select option:hover {
      background: rgba(0, 195, 255, 0.15);
      color: #00c3ff;
    }
  `
  document.head.appendChild(style)
}

const ROLES = ['user', 'vip', 'viewer']
const ALL_ROLES = ['admin', 'vip', 'user', 'viewer']
const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS).filter(k => k !== 'settings:manage')

function getPermissionLabelsForRole(role, permissionsMap) {
  if (!role) return []
  if (role === 'admin') return Object.values(PERMISSION_LABELS).filter(Boolean)
  const list = []
  for (const key of Object.keys(PERMISSION_LABELS)) {
    if (key === 'settings:manage') continue
    const roles = permissionsMap?.[key]
    if (Array.isArray(roles) && roles.includes(role)) list.push(PERMISSION_LABELS[key] ?? key)
  }
  return list
}

export default function SettingsPage() {
  const router = useRouter()
  const { hasPermission, refreshPermissions } = useAuth()
  const [permissions, setPermissions] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [updatingUserId, setUpdatingUserId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [permRes, usersRes] = await Promise.all([
          apiGet('api/settings/permissions'),
          apiGet('api/settings/users').catch(() => ({ users: [] }))
        ])
        if (!cancelled && permRes?.permissions) setPermissions(permRes.permissions)
        if (!cancelled && usersRes?.users) setUsers(usersRes.users)
      } catch (e) {
        if (!cancelled) setMessage({ type: 'error', text: '加载失败: ' + (e?.message || '') })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const toggle = (perm, role) => {
    if (!permissions) return
    const next = { ...permissions }
    const list = Array.isArray(next[perm]) ? [...next[perm]] : []
    const i = list.indexOf(role)
    if (i >= 0) list.splice(i, 1)
    else list.push(role)
    next[perm] = list.sort()
    setPermissions(next)
  }

  const updateUserRole = async (userId, newRole) => {
    setUpdatingUserId(userId)
    setMessage({ type: '', text: '' })
    try {
      await apiPatch('api/settings/users', { id: userId, role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setMessage({ type: 'success', text: '角色已更新' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: (e?.message || '更新失败') })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const save = async () => {
    if (!permissions) return
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await apiPut('api/settings/permissions', { permissions })
      refreshPermissions?.()
      setMessage({ type: 'success', text: '已保存，菜单权限已更新' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: (e?.message || '保存失败') })
    } finally {
      setSaving(false)
    }
  }

  if (!hasPermission('settings:manage')) {
    return (
      <div className="glass" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>无权限访问系统设置</p>
        <Link href="/monitor" style={{ color: 'var(--primary)' }}>返回监控</Link>
      </div>
    )
  }

  if (loading || permissions === null) {
    return (
      <div className="glass" style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </div>
    )
  }

  return (
    <div className="glass" style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: 'var(--text)',
          borderBottom: '2px solid rgba(0,149,255,0.3)',
          paddingBottom: '12px'
        }}>
          菜单用户权限
        </h2>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '14px', 
          lineHeight: '1.6' 
        }}>
          配置不同角色可以访问的菜单功能。admin 超管拥有全部权限，无需配置。
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.type === 'error' 
            ? 'rgba(255, 77, 79, 0.1)' 
            : 'rgba(0, 195, 255, 0.1)',
          border: message.type === 'error' 
            ? '1px solid rgba(255, 77, 79, 0.3)' 
            : '1px solid rgba(0, 195, 255, 0.3)',
          color: message.type === 'error' ? '#ff4d4f' : '#00c3ff',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>
            {message.type === 'error' ? '⚠️' : '✅'}
          </span>
          {message.text}
        </div>
      )}

      <div style={{ 
        background: 'rgba(0, 0, 0, 0.15)', 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(90deg, rgba(0,149,255,0.15) 0%, rgba(0,149,255,0.05) 100%)',
              borderBottom: '2px solid rgba(0,149,255,0.3)'
            }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '14px 16px', 
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                菜单/功能
              </th>
              {ROLES.map(role => (
                <th key={role} style={{ 
                  textAlign: 'center', 
                  padding: '14px 16px', 
                  color: 'var(--text)',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {ROLE_LABELS[role] ?? role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_KEYS.map((perm, index) => (
              <tr key={perm} style={{ 
                borderBottom: '1px solid rgba(0,149,255,0.1)',
                transition: 'background-color 0.2s'
              }}>
                <td style={{ 
                  padding: '12px 16px',
                  fontWeight: '500',
                  color: 'var(--text)'
                }}>
                  {PERMISSION_LABELS[perm] ?? perm}
                </td>
                {ROLES.map(role => {
                  const list = permissions[perm]
                  const checked = Array.isArray(list) && list.includes(role)
                  return (
                    <td key={role} style={{ 
                      textAlign: 'center', 
                      padding: '12px 16px'
                    }}>
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(perm, role)}
                          style={{ 
                            cursor: 'pointer',
                            accentColor: 'var(--primary)',
                            width: '18px',
                            height: '18px',
                            transform: 'scale(1.1)'
                          }}
                        />
                      </label>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: '32px', 
        display: 'flex', 
        justifyContent: 'flex-end',
        padding: '16px 0'
      }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={saving}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary) 0%, #00a8cc 100%)',
            color: '#000',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 2px 8px rgba(0, 195, 255, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: 'var(--text)',
          borderBottom: '2px solid rgba(0,149,255,0.3)',
          paddingBottom: '12px'
        }}>
          用户列表与权限
        </h2>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '14px', 
          lineHeight: '1.6' 
        }}>
          管理用户角色，调整用户可访问的菜单功能。
        </p>
      </div>

      <div style={{ 
        background: 'rgba(0, 0, 0, 0.15)', 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(90deg, rgba(0,149,255,0.15) 0%, rgba(0,149,255,0.05) 100%)',
              borderBottom: '2px solid rgba(0,149,255,0.3)'
            }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '14px 16px', 
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                用户名
              </th>
              <th style={{ 
                textAlign: 'left', 
                padding: '14px 16px', 
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                邮箱
              </th>
              <th style={{ 
                textAlign: 'left', 
                padding: '14px 16px', 
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                角色
              </th>
              <th style={{ 
                textAlign: 'left', 
                padding: '14px 16px', 
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                可见菜单
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr key={u.id} style={{ 
                borderBottom: '1px solid rgba(0,149,255,0.1)',
                transition: 'background-color 0.2s'
              }}>
                <td style={{ 
                  padding: '12px 16px',
                  fontWeight: '500',
                  color: 'var(--text)'
                }}>
                  {u.username ?? '-'}
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  color: 'var(--text-muted)',
                  fontSize: '13px'
                }}>
                  {u.email ?? '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={u.role ?? 'user'}
                    onChange={(e) => updateUserRole(u.id, e.target.value)}
                    disabled={updatingUserId === u.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(0,149,255,0.3)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'var(--text)',
                      fontSize: '13px',
                      cursor: updatingUserId === u.id ? 'wait' : 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"%3E%3Cpath d=\"M6 9L1 4H11L6 9Z\" fill=\"%2300c3ff\"/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                      backgroundSize: '12px',
                      paddingRight: '24px',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                    ))}
                  </select>
                  {updatingUserId === u.id && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      color: 'var(--text-muted)',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      保存中...
                    </span>
                  )}
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  color: 'var(--text-muted)', 
                  fontSize: '13px', 
                  lineHeight: '1.5'
                }}>
                  {getPermissionLabelsForRole(u.role, permissions).join('、') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: 'var(--text-muted)',
          fontSize: '14px'
        }}>
          暂无用户数据
        </div>
      )}
    </div>
  )
}
