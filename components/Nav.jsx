'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'

export default function Nav() {
  const pathname = usePathname()
  const { user, loading, hasPermission } = useAuth()

  const allLinks = [
    { href: '/monitor', label: '监控', permission: 'monitor:view' },
    { href: '/analyze', label: '分析', permission: 'analyze:run' },
    { href: '/signals', label: '信号', permission: 'signals:view' },
    { href: '/rules', label: '规则', permission: 'rules:manage' },
    { href: '/asset-classes', label: '投资产品', permission: 'asset-classes:manage' },
    { href: '/alerts', label: '提醒', permission: 'alerts:view' },
    { href: '/audit', label: '审计', permission: 'audit:view' },
    { href: '/settings', label: '系统设置', permission: 'settings:manage' },
  ]

  const links = allLinks.filter(link => !link.permission || hasPermission(link.permission))
  // 已登录或仍在加载（可能有 token）时至少显示「监控」，避免菜单完全消失
  const displayLinks = links.length > 0 ? links : ((user || loading) ? [allLinks[0]] : [])

  if (displayLinks.length === 0) return null

  return (
    <nav className="nav">
      {displayLinks.map(({ href, label }) => (
        <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
          {label}
        </Link>
      ))}
    </nav>
  )
}
