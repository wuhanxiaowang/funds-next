'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthContext'
import { apiGet, apiPost, apiPut } from '../../lib/api'
import { cronService } from '../../lib/cron-service'
import { CardSkeleton } from '../../components/Loading'
import SignalDetail from '../../components/SignalDetail'
import NewsDetail from '../../components/NewsDetail'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

function AnimatedValue({ value }) {
  const prevValueRef = useRef(value)
  const [animate, setAnimate] = useState(false)
  
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 500)
      return () => clearTimeout(timer)
    }
  }, [value])
  
  prevValueRef.current = value
  
  return (
    <span style={{
      display: 'inline-block',
      animation: animate ? 'pulse 0.5s ease' : 'none'
    }}>
      {value}
    </span>
  )
}

export default function MonitorPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
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
  const [newsScheduleIntervalMinutes, setNewsScheduleIntervalMinutes] = useState(120)
  const [newsScheduleIntervalOptions, setNewsScheduleIntervalOptions] = useState([])
  const [analysisScheduleIntervalMinutes, setAnalysisScheduleIntervalMinutes] = useState(120)
  const [analysisScheduleIntervalOptions, setAnalysisScheduleIntervalOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [validSignals, setValidSignals] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [signalsExpanded, setSignalsExpanded] = useState(false)
  const [selectedNews, setSelectedNews] = useState(null)
  const [newsDetail, setNewsDetail] = useState(null)
  
  // 数据可视化相关状态
  const [signalTrend, setSignalTrend] = useState([])
  const [industryDistribution, setIndustryDistribution] = useState([])
  const [timeRange, setTimeRange] = useState('day') // 'day', 'week', 'month'
  const [backtestData, setBacktestData] = useState(null)
  const [backtestLoading, setBacktestLoading] = useState(false)
  const [backtestPeriod, setBacktestPeriod] = useState(30) // 回测天数
  const [backtestExpanded, setBacktestExpanded] = useState(false) // 控制策略回测与复盘的展开/折叠状态
  const HISTORY_PAGE_SIZE = 10

  const refreshStats = async (signal) => {
    setLoading(true)
    try {
      const data = await apiGet('api/analyze/stats', {}, signal)
      setStats({
        newsCount: data.newsCount ?? 0,
        signalCount: data.signalCount ?? 0,
        validSignalCount: data.validSignalCount ?? 0,
        alertCount: data.alertCount ?? 0,
      })
      setLastUpdated(new Date().toLocaleString())
      setError('')
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError('获取统计失败: ' + (e.message || ''))
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshSchedule = async (signal) => {
    try {
      const data = await apiGet('api/analyze/schedule/status', {}, signal)
      setScheduleEnabled(data.enabled === true)
      if (typeof data.intervalMinutes === 'number') setAnalysisScheduleIntervalMinutes(data.intervalMinutes)
      if (Array.isArray(data.intervalOptions)) setAnalysisScheduleIntervalOptions(data.intervalOptions)
      setNextTimes(prev => ({
        ...prev,
        nextAnalysisTime: data.nextAnalysisTime ? new Date(data.nextAnalysisTime) : null
      }))
    } catch (e) {
      if (e.name !== 'AbortError') {
        setScheduleEnabled(false)
      }
    }
  }

  const refreshNewsSchedule = async (signal) => {
    try {
      const data = await apiGet('api/news/schedule/status', {}, signal)
      setNewsScheduleEnabled(data.enabled === true)
      if (typeof data.intervalMinutes === 'number') setNewsScheduleIntervalMinutes(data.intervalMinutes)
      if (Array.isArray(data.intervalOptions)) setNewsScheduleIntervalOptions(data.intervalOptions)
      setNextTimes(prev => ({
        ...prev,
        nextNewsTime: data.nextNewsTime ? new Date(data.nextNewsTime) : null
      }))
    } catch (e) {
      if (e.name !== 'AbortError') {
        setNewsScheduleEnabled(false)
      }
    }
  }

  const refreshAnalysisStatus = async (signal) => {
    try {
      const data = await apiGet('api/analyze/status', {}, signal)
      setAnalyzing(data.isRunning === true)
    } catch (e) {
      if (e.name !== 'AbortError') {
        setAnalyzing(false)
      }
    }
  }

  const refreshValidSignals = async (signal) => {
    try {
      const data = await apiGet('api/signals', { filter: 'valid', limit: 100 }, signal)
      const signals = Array.isArray(data) ? data : []
      setValidSignals(signals.slice(0, 5))
      const industryData = {}
      signals.forEach(s => {
        const industry = s.asset_class || '其他'
        industryData[industry] = (industryData[industry] || 0) + 1
      })
      const entries = Object.entries(industryData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
      const maxSlices = 5
      const top = entries.slice(0, maxSlices)
      const rest = entries.slice(maxSlices)
      if (rest.length > 0) {
        const otherSum = rest.reduce((sum, e) => sum + e.value, 0)
        top.push({ name: '其他', value: otherSum })
      }
      setIndustryDistribution(top)
    } catch (e) {
      console.error('获取有效信号失败:', e)
      setValidSignals([])
      // 请求失败时不清空饼图，保留上次数据，避免“有时出现有时消失”
    }
  }

  // 生成信号趋势数据（模拟）
  const generateSignalTrend = () => {
    const data = [];
    const now = new Date();
    
    if (timeRange === 'day') {
      // 按小时
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        const signals = Math.floor(Math.random() * 10) + 1;
        const validSignals = Math.floor(Math.random() * 5) + 1;
        data.push({
          time: date.getHours() + '时',
          signals: signals,
          validSignals: validSignals,
          efficiency: (validSignals / signals * 100).toFixed(1)
        });
      }
    } else if (timeRange === 'week') {
      // 按天
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const signals = Math.floor(Math.random() * 30) + 5;
        const validSignals = Math.floor(Math.random() * 15) + 3;
        data.push({
          time: date.getMonth() + 1 + '/' + date.getDate(),
          signals: signals,
          validSignals: validSignals,
          efficiency: (validSignals / signals * 100).toFixed(1)
        });
      }
    } else {
      // 按月
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const signals = Math.floor(Math.random() * 100) + 20;
        const validSignals = Math.floor(Math.random() * 50) + 10;
        data.push({
          time: date.getFullYear() + '/' + (date.getMonth() + 1),
          signals: signals,
          validSignals: validSignals,
          efficiency: (validSignals / signals * 100).toFixed(1)
        });
      }
    }
    
    setSignalTrend(data);
  }

  // 运行策略回测
  const runBacktest = async () => {
    setBacktestLoading(true);
    try {
      // 模拟回测数据
      const data = {
        period: backtestPeriod,
        totalSignals: 125,
        validSignals: 87,
        winRate: 0.68,
        averageReturn: 3.2,
        maxDrawdown: -8.5,
        sharpeRatio: 1.4
      };
      setBacktestData(data);
      showToast('回测完成', 'success');
    } catch (e) {
      showToast('回测失败: ' + (e.message || ''), 'error');
    } finally {
      setBacktestLoading(false);
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

  const refreshNews = async (signal) => {
    try {
      const data = await apiGet('api/news', { limit: 15 }, signal)
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
      const todayNews = allNews.filter(n => n.created_at && n.created_at.startsWith(today))
      const historyNews = allNews.filter(n => n.created_at && !n.created_at.startsWith(today))
      
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
      if (e.name !== 'AbortError') {
        console.error('获取新闻失败:', e)
      }
    }
  }

  // 切换标签时更新显示的新闻
  useEffect(() => {
    if (allNews.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const todayNews = allNews.filter(n => n.created_at && n.created_at.startsWith(today))
      const historyNews = allNews.filter(n => n.created_at && !n.created_at.startsWith(today))
      
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
        generateSignalTrend()
      }
    }
    
    // 初始加载
    refreshStats()
    refreshSchedule()
    refreshNewsSchedule()
    refreshNews()
    refreshAnalysisStatus()
    refreshValidSignals()
    generateSignalTrend()
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 仅在「分析中」时轮询分析状态，避免空闲时一直请求
  useEffect(() => {
    if (!analyzing) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAnalysisStatus()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [analyzing])

  // 时间范围变化时重新生成趋势数据
  useEffect(() => {
    generateSignalTrend()
  }, [timeRange])

  const runAnalysis = async () => {
    // 先检查分析状态，如果正在分析中，直接跳转到分析页面
    await refreshAnalysisStatus()
    // 跳转到分析页面并自动启动分析
    router.push('/analyze?autoStart=true')
  }

  const startSchedule = async () => {
    try {
      await apiPost('api/analyze/schedule/start', { intervalMinutes: analysisScheduleIntervalMinutes })
      const data = await apiGet('api/analyze/schedule/status')
      setScheduleEnabled(true)
      setNextTimes(prev => ({ ...prev, nextAnalysisTime: data.nextAnalysisTime ? new Date(data.nextAnalysisTime) : null }))
      const nextStr = data.nextAnalysisTime
        ? new Date(data.nextAnalysisTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : ''
      showToast(nextStr ? `已启动定时分析，下次执行: ${nextStr}` : '已启动定时分析（配置已持久化）', 'success')
    } catch (e) {
      setError('启动失败: ' + (e.message || ''))
    }
  }

  const stopSchedule = async () => {
    try {
      await apiPost('api/analyze/schedule/stop')
      await refreshSchedule()
      showToast('已停止定时分析', 'success')
    } catch (e) {
      setError('停止失败: ' + (e.message || ''))
    }
  }

  const updateAnalysisScheduleInterval = async (minutes) => {
    const num = Number(minutes)
    if (!Number.isFinite(num)) return
    setAnalysisScheduleIntervalMinutes(num)
    if (!scheduleEnabled) return
    try {
      await apiPut('api/analyze/schedule/config', { intervalMinutes: num })
      await refreshSchedule()
      showToast('已更新分析执行间隔', 'success')
    } catch (e) {
      showToast('更新间隔失败: ' + (e.message || ''), 'error')
    }
  }

  const startNewsSchedule = async () => {
    try {
      await apiPost('api/news/schedule/start', { intervalMinutes: newsScheduleIntervalMinutes })
      const data = await apiGet('api/news/schedule/status')
      setNewsScheduleEnabled(true)
      setNextTimes(prev => ({ ...prev, nextNewsTime: data.nextNewsTime ? new Date(data.nextNewsTime) : null }))
      const nextStr = data.nextNewsTime
        ? new Date(data.nextNewsTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : ''
      showToast(nextStr ? `已启动定时拉取，下次执行: ${nextStr}` : '已启动定时拉取新闻（配置已持久化）', 'success')
    } catch (e) {
      showToast('启动失败: ' + (e.message || ''), 'error')
    }
  }

  const stopNewsSchedule = async () => {
    try {
      await apiPost('api/news/schedule/stop')
      await refreshNewsSchedule()
      showToast('已停止定时拉取新闻', 'success')
    } catch (e) {
      showToast('停止失败: ' + (e.message || ''), 'error')
    }
  }

  const updateNewsScheduleInterval = async (minutes) => {
    const num = Number(minutes)
    if (!Number.isFinite(num)) return
    setNewsScheduleIntervalMinutes(num)
    if (!newsScheduleEnabled) return
    try {
      await apiPut('api/news/schedule/config', { intervalMinutes: num })
      await refreshNewsSchedule()
      showToast('已更新执行间隔', 'success')
    } catch (e) {
      showToast('更新间隔失败: ' + (e.message || ''), 'error')
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
      const historyNews = cleanedNews.filter(n => n.created_at && !n.created_at.startsWith(today))
      
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

  // 饼图颜色
  const COLORS = ['#00ff88', '#00c3ff', '#ffaa00', '#ff4444', '#9c27b0', '#3f51b5', '#4caf50', '#ff9800']

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
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>数据最后更新：{lastUpdated || '-'}</span>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#00c3ff' }}>{user.username}</span>
                <button
                  type="button"
                  onClick={() => { logout(); router.push('/login') }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 100, 100, 0.6)',
                    background: 'rgba(255, 68, 68, 0.2)',
                    color: '#ff6b6b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  退出
                </button>
              </div>
            )}
          </div>
          <div className="actions-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={fetchLatestNews} disabled={fetchingNews} style={{ background: '#00ff88', color: '#000', fontWeight: '600' }}>
              {fetchingNews ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                  抓取中...
                </span>
              ) : '立即拉取新闻'}
            </button>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing} style={{ background: '#00c3ff', color: '#000', fontWeight: '600' }}>
              {analyzing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                  分析中...
                </span>
              ) : '立即分析'}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push('/signals?filter=valid')} style={{ background: '#ff6b6b', color: '#fff', fontWeight: '600' }}>
              查看信号详情
            </button>
            <button className="btn btn-ghost" onClick={() => { refreshStats(); refreshSchedule(); refreshNewsSchedule(); refreshNews(); refreshValidSignals(); }} style={{ background: '#ffd93d', color: '#000', fontWeight: '600' }}>
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
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}><AnimatedValue value={stats.newsCount} /></div>
            </div>
          </div>
          {/* 今日信号 - 蓝 */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/signals')}>
            <div className="stat-icon blue" style={{ fontSize: '24px' }}>📊</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>今日信号</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}><AnimatedValue value={stats.signalCount} /></div>
            </div>
          </div>
          {/* 有效信号 - 黄 */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/signals?filter=valid')}>
            <div className="stat-icon orange" style={{ fontSize: '24px' }}>✓</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>有效信号</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}><AnimatedValue value={stats.validSignalCount} /></div>
            </div>
          </div>
          {/* 提醒次数 - 红 */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/alerts')}>
            <div className="stat-icon red" style={{ fontSize: '24px' }}>🔔</div>
            <div>
              <div className="stat-title" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>提醒次数</div>
              <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}><AnimatedValue value={stats.alertCount} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据可视化区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* 信号趋势图 */}
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>信号趋势</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn" 
                onClick={() => setTimeRange('day')}
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '12px',
                  background: timeRange === 'day' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: timeRange === 'day' ? '#fff' : 'var(--text)'
                }}
              >
                按日
              </button>
              <button 
                className="btn" 
                onClick={() => setTimeRange('week')}
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '12px',
                  background: timeRange === 'week' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: timeRange === 'week' ? '#fff' : 'var(--text)'
                }}
              >
                按周
              </button>
              <button 
                className="btn" 
                onClick={() => setTimeRange('month')}
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '12px',
                  background: timeRange === 'month' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: timeRange === 'month' ? '#fff' : 'var(--text)'
                }}
              >
                按月
              </button>
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,170,0,0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="signals" name="信号总数" stroke="#00c3ff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="validSignals" name="有效信号" stroke="#00ff88" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="efficiency" name="有效率(%)" yAxisId="right" stroke="#ffaa00" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 行业分布柱状图 */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>行业分布</h3>
          <div style={{ height: '300px' }}>
            {industryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryDistribution} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--text)', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} 条`, '数量']}
                    contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', padding: '8px 12px', fontSize: '13px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" name="条数" radius={[0, 4, 4, 0]} maxBarSize={36}>
                    {industryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
                暂无有效信号，请先拉取新闻并分析
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 策略回测与复盘 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>策略回测与复盘</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => setBacktestExpanded(!backtestExpanded)}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              {backtestExpanded ? '收起' : '展开'}
            </button>
          </div>
        </div>
        {backtestExpanded && (
          <>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>回测周期：</span>
                <input 
                  type="number" 
                  value={backtestPeriod} 
                  onChange={(e) => setBacktestPeriod(parseInt(e.target.value) || 30)}
                  style={{ 
                    width: '80px', 
                    padding: '6px 10px', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>天</span>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={runBacktest}
                disabled={backtestLoading}
                style={{ background: '#00c3ff', color: '#000', fontWeight: '600' }}
              >
                {backtestLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                    回测中...
                  </span>
                ) : '开始回测'}
              </button>
            </div>
            
            {backtestData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>回测周期</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>{backtestData.period} 天</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>总信号数</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>{backtestData.totalSignals}</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>有效信号数</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#00ff88' }}>{backtestData.validSignals}</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>胜率</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#00c3ff' }}>{(backtestData.winRate * 100).toFixed(1)}%</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>平均收益率</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#00ff88' }}>{backtestData.averageReturn}%</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>最大回撤</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#ff4444' }}>{backtestData.maxDrawdown}%</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>夏普比率</div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#ffaa00' }}>{backtestData.sharpeRatio.toFixed(2)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 有效信号详情列表 */}
      {validSignals.length > 0 && (
        <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0 }}>最近有效信号</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setSignalsExpanded(!signalsExpanded)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                {signalsExpanded ? '收起' : '展开'}
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => router.push('/signals?filter=valid')}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                查看全部
              </button>
            </div>
          </div>
          {signalsExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {validSignals.map((signal) => {
                // 根据信号方向设置不同颜色
                let dirStyle;
                if (signal.direction === '涨' || signal.direction === '看多') {
                  dirStyle = {
                    background: 'rgba(0, 255, 136, 0.15)',
                    color: '#00ff88',
                    border: '1px solid rgba(0, 255, 136, 0.3)'
                  };
                } else if (signal.direction === '跌' || signal.direction === '看空') {
                  dirStyle = {
                    background: 'rgba(255, 77, 79, 0.15)',
                    color: '#ff4d4f',
                    border: '1px solid rgba(255, 77, 79, 0.3)'
                  };
                } else {
                  dirStyle = {
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  };
                }
                
                // 时效性标签
                let periodStyle;
                if (signal.period === '短期 1-3 天') {
                  periodStyle = {
                    background: 'rgba(0, 255, 136, 0.15)',
                    color: '#00ff88',
                    border: '1px solid rgba(0, 255, 136, 0.3)'
                  };
                } else if (signal.period === '中期 1-2 周') {
                  periodStyle = {
                    background: 'rgba(0, 195, 255, 0.15)',
                    color: '#00c3ff',
                    border: '1px solid rgba(0, 195, 255, 0.3)'
                  };
                } else if (signal.period === '长期 1 个月+') {
                  periodStyle = {
                    background: 'rgba(255, 170, 0, 0.15)',
                    color: '#ffaa00',
                    border: '1px solid rgba(255, 170, 0, 0.3)'
                  };
                } else {
                  periodStyle = {
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  };
                }
                
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...periodStyle
                          }}>
                            {signal.period || '未知周期'}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {signal.asset_class || '-'}
                          </span>
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
          )}
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
              <div 
                key={item.id || index} 
                style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid rgba(0, 149, 255, 0.1)', 
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setNewsDetail(item)}
              >
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
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={(e) => {
                    e.stopPropagation();
                    // 显示新闻详情
                    setNewsDetail(item);
                  }}>
                    查看详情
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={(e) => {
                    e.stopPropagation();
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>执行间隔</span>
              <select
                className="schedule-interval-select"
                value={newsScheduleIntervalMinutes}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (newsScheduleEnabled) updateNewsScheduleInterval(v)
                  else setNewsScheduleIntervalMinutes(v)
                }}
                style={{ padding: '6px 10px', borderRadius: '6px', minWidth: '120px' }}
              >
                {(newsScheduleIntervalOptions.length ? newsScheduleIntervalOptions : [
                  { value: 15, label: '15 分钟' }, { value: 30, label: '30 分钟' }, { value: 60, label: '1 小时' },
                  { value: 120, label: '2 小时' }, { value: 240, label: '4 小时' }, { value: 1440, label: '24 小时' }
                ]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {newsScheduleEnabled && nextTimes.nextNewsTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>下次执行时间</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {nextTimes.nextNewsTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>执行间隔</span>
              <select
                className="schedule-interval-select"
                value={analysisScheduleIntervalMinutes}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (scheduleEnabled) updateAnalysisScheduleInterval(v)
                  else setAnalysisScheduleIntervalMinutes(v)
                }}
                style={{ padding: '6px 10px', borderRadius: '6px', minWidth: '120px' }}
              >
                {(analysisScheduleIntervalOptions.length ? analysisScheduleIntervalOptions : [
                  { value: 15, label: '15 分钟' }, { value: 30, label: '30 分钟' }, { value: 60, label: '1 小时' },
                  { value: 120, label: '2 小时' }, { value: 240, label: '4 小时' }, { value: 1440, label: '24 小时' }
                ]).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {scheduleEnabled && nextTimes.nextAnalysisTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>下次执行时间</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {nextTimes.nextAnalysisTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">版本号</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>v{process.env.NEXT_PUBLIC_BUILD_VERSION || '1.0.0'}</span>
          </div>
        </div>
      </div>

      {/* 新闻详情模态框 */}
      {newsDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(18, 18, 18, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#fff',
                flex: 1,
                marginRight: '16px'
              }}>
                {newsDetail.title || '无标题'}
              </h3>
              <button 
                onClick={() => setNewsDetail(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                ×
              </button>
            </div>
            
            {newsDetail.created_at && (
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginBottom: '16px'
              }}>
                {new Date(newsDetail.created_at).toLocaleString()}
              </div>
            )}
            
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#fff',
              marginBottom: '20px',
              whiteSpace: 'pre-wrap'
            }}>
              {newsDetail.content || '无内容'}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button 
                onClick={() => setNewsDetail(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                关闭
              </button>
              <button 
                onClick={() => {
                  router.push(`/signals?news_id=${newsDetail.id}`);
                  setNewsDetail(null);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 149, 255, 0.4)',
                  background: 'rgba(0, 149, 255, 0.15)',
                  color: '#00c3ff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 149, 255, 0.25)'
                  e.currentTarget.style.borderColor = 'rgba(0, 149, 255, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 149, 255, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(0, 149, 255, 0.4)'
                }}
              >
                查看关联信号
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}