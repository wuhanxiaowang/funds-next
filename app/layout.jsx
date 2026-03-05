import './globals.css'
import Nav from '../components/Nav'
import { cronService } from '../lib/cron-service'

// 启动定时任务服务
cronService.start()

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-layout">
          <header className="app-header">
            <h1>投资信号系统</h1>
            <Nav />
          </header>
          <main className="app-main"><div className="app-main-inner">{children}</div></main>
        </div>
      </body>
    </html>
  )
}
