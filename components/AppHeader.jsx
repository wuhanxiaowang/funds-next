'use client'
import { usePathname } from 'next/navigation'
import Nav from './Nav'

export default function AppHeader() {
  const pathname = usePathname()

  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <h1>投资信号系统</h1>
        <div className="app-header-nav">
          <Nav />
        </div>
      </div>
    </header>
  )
}
