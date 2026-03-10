import './globals.css'
import AppHeader from '../components/AppHeader'
import { cronService } from '../lib/cron-service'
import { AuthProvider } from '../components/AuthContext'

cronService.start().catch(e => console.error('定时任务启动失败:', e?.message))

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <div className="app-layout">
            <AppHeader />
            <main className="app-main"><div className="app-main-inner">{children}</div></main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
