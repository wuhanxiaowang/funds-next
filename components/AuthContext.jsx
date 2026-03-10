'use client'
import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'
import { PERMISSIONS } from '../lib/permissions'
import { getApiUrl, apiGet } from '../lib/api'

const AuthContext = createContext(null)

function getInitialUser() {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (token && userData) {
    try {
      return JSON.parse(userData)
    } catch (_) {
      return null
    }
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissionsMap, setPermissionsMap] = useState(null)

  // 客户端挂载后立即从 localStorage 恢复 user，避免首屏菜单/用户信息不显示
  useLayoutEffect(() => {
    const u = getInitialUser()
    if (u) setUser(u)
    setLoading(false)
  }, [])

  const refreshPermissions = async () => {
    if (!user) return
    try {
      const data = await apiGet('api/settings/permissions')
      if (data?.permissions) setPermissionsMap(data.permissions)
    } catch (e) {
      // 忽略错误，使用本地默认配置
    }
  }

  useEffect(() => {
    if (user) {
      // 延迟执行，避免页面跳转时请求被取消
      const timer = setTimeout(() => {
        refreshPermissions()
      }, 100)
      
      return () => {
        clearTimeout(timer)
      }
    }
  }, [user])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setPermissionsMap(null)
    // 立即开始获取权限，而不是等user状态更新后
    setTimeout(() => {
      refreshPermissions()
    }, 100)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setPermissionsMap(null)
  }

  const hasPermission = (permission) => {
    if (!user) return false
    const role = (user.role || 'user').toLowerCase()
    if (role === 'admin') return true
    // 优先使用从 API 获取的权限配置，如果没有则使用本地默认配置
    const permissions = permissionsMap || PERMISSIONS
    const result = permissions[permission]?.includes(role) ?? false
    return result
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
