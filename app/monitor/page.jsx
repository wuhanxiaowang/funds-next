'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost } from '../../lib/api'
import { cronService } from '../../lib/cron-service'
import { CardSkeleton } from '../../components/Loading'
import SignalDetail from '../../components/SignalDetail'

export default function MonitorPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ newsCount: 0, signalCount: 0, validSignalCount: 0, alertCount: 0 })
  const [analyzing, setAnalyzing] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [newsScheduleEnabled, setNewsScheduleEnabled] = useState(false)
  const [lastMessage, setLastMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [error, setError] = useState('')
  const [news, setNews] = useState([])
  const [allNews, setAllNews] = useState([])
  const [fetchingNews, setFetchingNews] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [newsTab, setNewsTab] = useState('today') // 'today' 或 'history'
  const [historyPage, setHistoryPage] = useState(1)
  const [nextTimes, setNextTimes] = useState({ nextNewsTime: null, nextAnalysisTime: null })
  const [loading, setLoading] = useState(true)
  const [validSignals, setValidSignals] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)
  const HISTORY_PAGE_SIZE = 10

  const refreshStats = async () => {
    setLoading(true)
    try {
      const data = await apiGet('api/analyze/stats')
      setStats({
        newsCount: data.newsCount ?? 0,
        signalCount: data.signalCount ?? 0,
        validSignalCount: data.validSignalCount ?? 0,
        alertCount: data.alertCount ?? 0,
      })
      setLastUpdated(new Date().toLocaleString())
      setError('')
    } catch (e) {
      setError('获取统计失败: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const refreshSchedule = async () => {
    try {
      const data = await apiGet('api/analyze/schedule/status')
      setScheduleEnabled(data.enabled === true)
    } catch (_) {
      setScheduleEnabled(false)
    }
  }

  const refreshNewsSchedule = async () => {
    try {
      const data = await apiGet('api/news/schedule/status')
      setNewsScheduleEnabled(data.enabled === true)
    } catch (_) {
      setNewsScheduleEnabled(false)
    }
  }

  const refreshAnalysisStatus = async () => {
    try {
      const data = await apiGet('api/analyze/status')
      setAnalyzing(data.isRunning === true)
    } catch (_) {
      setAnalyzing(false)
    }
  }

  const refreshValidSignals = async () => {
    try {
      const data = await apiGet('api/signals', { filter: 'valid', limit: 5 })
      setValidSignals(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('获取有效信号失败:', e)
      setValidSignals([])
    }
  }

  // 去除HTML标签函数
  const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return ''
    // 先替换常见的HTML实体
    let text = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
    
    // 去除HTML标签
    text = text.replace(/<[^>]*>/g, ' ')
    
    // 去除多余空格
    text = text.replace(/\s+/g, ' ').trim()
    
    return text
  }

  const refreshNews = async () => {
    try {
      const data = await apiGet('api/news', { limit: 15 })
      // 处理返回格式（可能是数组或对象）
      const newsList = data.news || (Array.isArray(data) ? data : [])
      // 去除HTML标签
      const cleanedNews = newsList.map(item => ({
        ...item,
        content: stripHtml(item.content || ''),
        title: stripHtml(item.title || '')
      }))
      setAllNews(cleanedNews)
      
      // 分离今日新闻和历史新闻
      const today = new Date().toISOString().slice(0, 10)
      const todayNews = cleanedNews.filter(n => n.created_at && n.created_at.startsWith(today))
      const historyNews = cleanedNews.filter(n => !n.created_at || !n.created_at.startsWith(today))
      
      // 根据当前标签显示对应的新闻
      if (newsTab === 'today') {
        setNews(todayNews)
      } else {
        // 历史新闻分页
        const startIndex = (historyPage - 1) * HISTORY_PAGE_SIZE
        const endIndex = startIndex + HISTORY_PAGE_SIZE
        setNews(historyNews.slice(startIndex, endIndex))
      }
    } catch (e) {
      console.error('获取新闻失败:', e)
    }
  }

  // 切换标签时更新显示的新闻
  useEffect(() => {
    if (allNews.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const todayNews = allNews.filter(n => n.created_at && n.created_at.startsWith(today))
      const historyNews = allNews.filter(n => !n.created_at || !n.created_at.startsWith(today))
      
      if (newsTab === 'today') {
        setNews(todayNews)
      } else {
        // 历史新闻分页
        const startIndex = (historyPage - 1) * HISTORY_PAGE_SIZE
        const endIndex = startIndex + HISTORY_PAGE_SIZE
        setNews(historyNews.slice(startIndex, endIndex))
      }
    }
  }, [newsTab, allNews, historyPage])

  // 定期更新下次执行时间
  useEffect(() => {
    const updateNextTimes = () => {
      const times = cronService.getNextTimes()
      setNextTimes(times)
    }
    
    // 初始更新
    updateNextTimes()
    
    // 每10秒更新一次
    const interval = setInterval(updateNextTimes, 10000)
    
    return () => clearInterval(interval)
  }, [])

  // 页面可见性API，只在页面可见时加载数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时加载数据
        refreshStats()
        refreshSchedule()
        refreshNewsSchedule()
        refreshNews()
        refreshAnalysisStatus()
        refreshValidSignals()
      }
    }
    
    // 初始加载
    refreshStats()
    refreshSchedule()
    refreshNewsSchedule()
    refreshNews()
    refreshAnalysisStatus()
    refreshValidSignals()
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 每3秒刷新一次分析状态
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAnalysisStatus()
      }
    }, 3000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [])

  const runAnalysis = async () => {
    // 先检查分析状态，如果正在分析中，直接跳转到分析页面
    await refreshAnalysisStatus()
    // 跳转到分析页面并自动启动分析
    router.push('/analyze?autoStart=true')
  }

  const startSchedule = async () => {
    try {
      await apiPost('api/analyze/schedule/start')
      setScheduleEnabled(true)
      // 重新计算下次执行时间（2小时后）
      const now = new Date()
      const nextAnalysisTime = new Date(now)
      nextAnalysisTime.setHours(nextAnalysisTime.getHours() + 2)
      const nextNewsTime = nextTimes.nextNewsTime
      setNextTimes({ nextNewsTime, nextAnalysisTime })
      const timeStr = `${String(nextAnalysisTime.getHours()).padStart(2, '0')}:${String(nextAnalysisTime.getMinutes()).padStart(2, '0')}:${String(nextAnalysisTime.getSeconds()).padStart(2, '0')}`
      showToast('已启动定时分析，下次分析时间: ' + timeStr, 'success')
    } catch (e) {
      setError('启动失败: ' + (e.message || ''))
    }
  }

  const stopSchedule = async () => {
    try {
      await apiPost('api/analyze/schedule/stop')
      setScheduleEnabled(false)
    } catch (e) {
      setError('停止失败: ' + (e.message || ''))
    }
  }

  const startNewsSchedule = async () => {
    try {
      await apiPost('api/news/schedule/start')
      setNewsScheduleEnabled(true)
      // 重新计算下次执行时间（2小时后）
      const now = new Date()
      const nextNewsTime = new Date(now)
      nextNewsTime.setHours(nextNewsTime.getHours() + 2)
      const nextAnalysisTime = nextTimes.nextAnalysisTime
      setNextTimes({ nextNewsTime, nextAnalysisTime })
      const timeStr = `${String(nextNewsTime.getHours()).padStart(2, '0')}:${String(nextNewsTime.getMinutes()).padStart(2, '0')}:${String(nextNewsTime.getSeconds()).padStart(2, '0')}`
      showToast('已启动定时拉取新闻，下次拉取时间: ' + timeStr, 'success')
    } catch (e) {
      showToast('启动失败: ' + (e.message || ''), 'error')
    }
  }

  const stopNewsSchedule = async () => {
    try {
      await apiPost('api/news/schedule/stop')
      setNewsScheduleEnabled(false)
      showToast('已停止定时拉取新闻', 'success')
    } catch (e) {
      showToast('停止失败: ' + (e.message || ''), 'error')
    }
  }

  const fetchLatestNews = async () => {
    setFetchingNews(true)
    setError('')
    try {
      // 调用新闻API并触发抓取
      const data = await apiGet('api/news', { fetch: true, limit: 15 })
      // 处理新的返回格式
      const newsList = data.news || (Array.isArray(data) ? data : [])
      const addedCount = data.addedCount || 0
      const totalCount = data.totalCount || newsList.length
      
      // 去除HTML标签
      const cleanedNews = newsList.map(item => ({
        ...item,
        content: stripHtml(item.content || ''),
        title: stripHtml(item.title || '')
      }))
      setAllNews(cleanedNews)
      // 根据当前标签更新显示
      const today = new Date().toISOString().slice(0, 10)
      const todayNews = cleanedNews.filter(n => n.created_at && n.created_at.startsWith(today))
      const historyNews = cleanedNews.filter(n => !n.created_at || !n.created_at.startsWith(today))
      
      if (newsTab === 'today') {
        setNews(todayNews)
      } else {
        // 历史新闻分页
        const startIndex = (historyPage - 1) * HISTORY_PAGE_SIZE
        const endIndex = startIndex + HISTORY_PAGE_SIZE
        setNews(historyNews.slice(startIndex, endIndex))
      }
      // 显示弹框提示
      showToast(`新闻抓取成功，新增 ${addedCount} 条，数据库共 ${totalCount} 条`, 'success')
      // 刷新统计数据
      refreshStats()
    } catch (e) {
      showToast('抓取新闻失败: ' + (e.message || ''), 'error')
    } finally {
      setFetchingNews(false)
    }
  }

  // 显示弹框提示
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    // 3秒后自动消失
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  return (
    <div>
      {/* 快捷操作区 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>系统监控</span>
            <span className={`tag ${scheduleEnabled ? 'tag-success' : 'tag-info'}`} style={{ padding: '4px 10px', borderRadius: '6px', background: scheduleEnabled ? '#00ff88' : '#00c3ff', color: '#000', fontWeight: '600' }}>
              {scheduleEnabled ? '定时分析中' : '系统就绪'}
            </span>
            {newsScheduleEnabled && (
              <span className="tag tag-success" style={{ padding: '4px 10px', borderRadius: '6px', background: '#ffd93d', color: '#000', fontWeight: '600' }}>
                定时拉取新闻中
              </span>
            )}
          </div>
          <div className="actions-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={fetchLatestNews} disabled={fetchingNews} style={{ background: '#00ff88', color: '#000', fontWeight: '600' }}>
              {fetchingNews ? '抓取中...' : '立即拉取新闻'}
            </button>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing} style={{ background: '#00c3ff', color: '#000', fontWeight: '600' }}>
              {analyzing ? '分析中...' : '立即分析'}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push('/signals?filter=valid')} style={{ background: '#ff6b6b', color: '#fff', fontWeight: '600' }}>
              查看信号详情
            </button>
            <button className="btn btn-ghost" onClick={() => { refreshStats(); refreshSchedule(); refreshNewsSchedule(); refreshNews(); }} style={{ background: '#ffd93d', color: '#000', fontWeight: '600' }}>
              刷新数据
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert" style={{ background: 'rgba(255,77,79,0.15)', borderColor: 'rgba(255,77,79,0.3)' }}>{error}</div>}
      
      {/* 弹框提示 */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          animation: 'fadeInDown 0.3s ease'
        }}>
          <div style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: toast.type === 'success' ? 'rgba(0, 255, 136, 0.9)' : 'rgba(255, 77, 79, 0.9)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {toast.message}
          </div>
        </div>
      )}





      {/* 结果区 - 核心指标 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>信号统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {/* 今日新闻 - 绿 */}
          <div className="stat-card">
            <div className="stat-icon green" style={{ fontSize: '24px' }}>📰</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>今日新闻</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{stats.newsCount}</div>
            </div>
          </div>
          {/* 今日信号 - 蓝 */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/signals')}>
            <div className="stat-icon blue" style={{ fontSize: '24px' }}>📊</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>今日信号</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{stats.signalCount}</div>
            </div>
          </div>
          {/* 有效信号 - 黄 */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/signals?filter=valid')}>
            <div className="stat-icon orange" style={{ fontSize: '24px' }}>✓</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>有效信号</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{stats.validSignalCount}</div>
            </div>
          </div>
          {/* 提醒次数 - 红 */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/alerts')}>
            <div className="stat-icon red" style={{ fontSize: '24px' }}>🔔</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>提醒次数</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{stats.alertCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 有效信号详情列表 */}
      {validSignals.length > 0 && (
        <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0 }}>最近有效信号</h3>
            <button 
              className="btn btn-ghost" 
              onClick={() => router.push('/signals?filter=valid')}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              查看全部
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {validSignals.map((signal) => {
              const dirStyle = { bg: 'transparent', color: 'var(--text)', border: '1px solid rgba(255, 255, 255, 0.1)' }
              
              return (
                <div 
                  key={signal.id}
                  onClick={() => setSelectedSignal(signal)}
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    ':hover': {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(0, 149, 255, 0.3)'
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: '#fff' }}>
                        {signal.event || '未知事件'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {signal.asset_class || '-'} · {signal.period || '-'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        ...dirStyle
                      }}>
                        {signal.direction}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: 'rgba(255, 169, 64, 0.15)',
                        color: '#ffa940',
                        border: '1px solid rgba(255, 169, 64, 0.3)'
                      }}>
                        强度 {signal.strength}
                      </span>
                    </div>
                  </div>
                  {signal.news && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '8px',
                      padding: '8px 10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      borderLeft: '3px solid rgba(0, 149, 255, 0.5)'
                    }}>
                      📰 {signal.news.title || '无标题'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 信号详情模态框 */}
      {selectedSignal && (
        <SignalDetail 
          signal={selectedSignal} 
          onClose={() => setSelectedSignal(null)} 
        />
      )}

      {/* 新闻模块 */}
      <div className="glass" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>新闻列表</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn" 
              onClick={() => { setNewsTab('today'); setHistoryPage(1); }}
              style={{ 
                padding: '6px 16px', 
                fontSize: '13px',
                background: newsTab === 'today' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: newsTab === 'today' ? '#fff' : 'var(--text)'
              }}
            >
              今日新闻
            </button>
            <button 
              className="btn" 
              onClick={() => { setNewsTab('history'); setHistoryPage(1); }}
              style={{ 
                padding: '6px 16px', 
                fontSize: '13px',
                background: newsTab === 'history' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: newsTab === 'history' ? '#fff' : 'var(--text)'
              }}
            >
              历史新闻
            </button>
          </div>
        </div>
        {news.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无新闻数据</div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {news.map((item, index) => (
              <div key={item.id || index} style={{ 
                padding: '12px', 
                borderBottom: '1px solid rgba(0, 149, 255, 0.1)', 
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{item.title || '无标题'}</h4>
                    {item.analyzed && (
                      <span className="tag tag-success" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        已分析
                      </span>
                    )}
                    {!item.analyzed && (
                      <span className="tag tag-info" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        未分析
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                  </span>
                </div>
                <p style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '13px', 
                  color: 'var(--text-muted)', 
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.content || '无内容'}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => {
                    // 显示新闻详情
                    alert(`新闻详情：\n标题：${item.title || '无标题'}\n\n${item.content || '无内容'}`);
                  }}>
                    查看详情
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => {
                    // 跳转到信号列表，过滤该新闻的信号
                    router.push(`/signals?news_id=${item.id}`);
                  }}>
                    关联信号
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 历史新闻分页 */}
        {newsTab === 'history' && allNews.filter(n => {
          const today = new Date().toISOString().slice(0, 10)
          return !n.created_at || !n.created_at.startsWith(today)
        }).length > HISTORY_PAGE_SIZE && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '16px', 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 149, 255, 0.1)'
          }}>
            <button 
              className="btn btn-ghost" 
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              上一页
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              第 {historyPage} 页 / 共 {Math.ceil(allNews.filter(n => {
                const today = new Date().toISOString().slice(0, 10)
                return !n.created_at || !n.created_at.startsWith(today)
              }).length / HISTORY_PAGE_SIZE)} 页
            </span>
            <button 
              className="btn btn-ghost" 
              disabled={historyPage >= Math.ceil(allNews.filter(n => {
                const today = new Date().toISOString().slice(0, 10)
                return !n.created_at || !n.created_at.startsWith(today)
              }).length / HISTORY_PAGE_SIZE)}
              onClick={() => setHistoryPage(p => p + 1)}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 数据采集区 - 左侧 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>数据采集</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>定时拉取状态</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                  {newsScheduleEnabled ? '已启动' : '已停止'}
                </div>
              </div>
              {!newsScheduleEnabled ? (
                <button className="btn btn-success" onClick={startNewsSchedule}>
                  启动定时拉取
                </button>
              ) : (
                <button className="btn btn-warning" onClick={stopNewsSchedule}>
                  停止定时拉取
                </button>
              )}
            </div>
            {newsScheduleEnabled && nextTimes.nextNewsTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>下次拉取时间</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {String(nextTimes.nextNewsTime.getHours()).padStart(2, '0')}:{String(nextTimes.nextNewsTime.getMinutes()).padStart(2, '0')}:{String(nextTimes.nextNewsTime.getSeconds()).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 分析区 - 右侧 */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>分析</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>定时分析状态</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                  {scheduleEnabled ? '已启动' : '已停止'}
                </div>
              </div>
              {!scheduleEnabled ? (
                <button className="btn btn-success" onClick={startSchedule}>
                  启动定时分析
                </button>
              ) : (
                <button className="btn btn-warning" onClick={stopSchedule}>
                  停止定时分析
                </button>
              )}
            </div>
            {scheduleEnabled && nextTimes.nextAnalysisTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>下次分析时间</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {String(nextTimes.nextAnalysisTime.getHours()).padStart(2, '0')}:{String(nextTimes.nextAnalysisTime.getMinutes()).padStart(2, '0')}:{String(nextTimes.nextAnalysisTime.getSeconds()).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 系统状态模块 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>系统状态</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">服务状态</span>
            <span className="tag tag-success">正常</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">上次更新</span>
            <span style={{ fontSize: '14px' }}>{lastUpdated || '-'}</span>
          </div>

        </div>
      </div>

    </div>
  )
}
