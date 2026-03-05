'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  const links = [
    { href: '/monitor', label: '监控' },
    { href: '/analyze', label: '分析' },
    { href: '/signals', label: '信号' },
    { href: '/rules', label: '规则' },
    { href: '/asset-classes', label: '投资产品' },
    { href: '/alerts', label: '提醒' },
  ]
  return (
    <nav className="nav">
      {links.map(({ href, label }) => (
        <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
          {label}
        </Link>
      ))}
    </nav>
  )
}
