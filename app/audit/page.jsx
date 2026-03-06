'use client'
import { useState, useEffect } from 'react'
import { apiGet } from '../../lib/api'

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({
    type: '',
    operation: '',
    startDate: '',
    endDate: ''
  })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        limit: PAGE_SIZE,
        ...filter
      }
      
      const data = await apiGet('api/audit', params)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError('获取审计日志失败: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // 页面可见性API，只在页面可见时加载数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLogs()
      }
    }
    
    // 初始加载
    fetchLogs()
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [filter, page])

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }))
    setPage(1) // 重置页码
  }

  const getOperationLabel = (operation) => {
    const labels = {
      trigger_analysis: '触发分析',
      modify_rule: '修改规则',
      view_data: '查看数据',
      fetch_news: '抓取新闻',
      generate_signal: '生成信号',
      schedule_run: '定时任务'
    }
    return labels[operation] || operation
  }

  const getTypeLabel = (type) => {
    return type === 'user_action' ? '用户操作' : '系统行为'
  }

  const getTypeColor = (type) => {
    return type === 'user_action' ? 'var(--primary)' : 'var(--success)'
  }

  // 从User-Agent解析操作系统
  const getOSFromUserAgent = (userAgent) => {
    if (!userAgent) return '-'
    const ua = userAgent.toLowerCase()
    if (ua.includes('windows nt 10.0')) return 'Windows 10/11'
    if (ua.includes('windows nt 6.3')) return 'Windows 8.1'
    if (ua.includes('windows nt 6.2')) return 'Windows 8'
    if (ua.includes('windows nt 6.1')) return 'Windows 7'
    if (ua.includes('windows nt 6.0')) return 'Windows Vista'
    if (ua.includes('windows nt 5.1')) return 'Windows XP'
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS'
    if (ua.includes('linux')) return 'Linux'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS'
    return 'Unknown'
  }

  // 格式化IP地址显示
  const formatIP = (ip) => {
    if (!ip || ip === 'unknown') return '-'
    // IPv6本地地址转换为IPv4显示
    if (ip === '::1') return '127.0.0.1'
    // 处理IPv6映射的IPv4地址
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '')
    return ip
  }

  // select样式
  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(0, 149, 255, 0.2)',
    background: 'rgba(30, 40, 60, 0.8)',
    color: 'var(--text)',
    fontSize: '14px',
    cursor: 'pointer'
  }

  // option样式
  const optionStyle = {
    background: 'rgba(30, 40, 60, 0.95)',
    color: 'var(--text)',
    padding: '8px 12px'
  }

  return (
    <div>
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>操作留痕与审计</span>
            <span className="tag tag-info" style={{ padding: '4px 10px', borderRadius: '6px' }}>
              审计日志
            </span>
          </div>
          <button className="btn btn-ghost" onClick={fetchLogs} disabled={loading}>
            {loading ? '加载中...' : '刷新数据'}
          </button>
        </div>
      </div>

      {error && <div className="alert" style={{ background: 'rgba(255,77,79,0.15)', borderColor: 'rgba(255,77,79,0.3)' }}>{error}</div>}

      {/* 筛选条件 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>筛选条件</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>操作类型</label>
            <select 
              value={filter.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>全部类型</option>
              <option value="user_action" style={optionStyle}>用户操作</option>
              <option value="system_action" style={optionStyle}>系统行为</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>具体操作</label>
            <select 
              value={filter.operation}
              onChange={(e) => handleFilterChange('operation', e.target.value)}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>全部操作</option>
              <option value="trigger_analysis" style={optionStyle}>触发分析</option>
              <option value="modify_rule" style={optionStyle}>修改规则</option>
              <option value="view_data" style={optionStyle}>查看数据</option>
              <option value="fetch_news" style={optionStyle}>抓取新闻</option>
              <option value="generate_signal" style={optionStyle}>生成信号</option>
              <option value="schedule_run" style={optionStyle}>定时任务</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>开始日期</label>
            <input 
              type="date"
              value={filter.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 149, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>结束日期</label>
            <input 
              type="date"
              value={filter.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 149, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 审计日志列表 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>审计日志</h3>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无审计日志数据</div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.2fr 0.8fr 1.5fr 1fr 1.2fr 0.8fr', 
              gap: '16px', 
              padding: '12px', 
              borderBottom: '1px solid rgba(0, 149, 255, 0.2)',
              fontWeight: 600,
              fontSize: '14px'
            }}>
              <div>时间</div>
              <div>类型</div>
              <div>操作</div>
              <div>用户IP</div>
              <div>操作系统</div>
              <div>详情</div>
            </div>
            {logs.map((log, index) => (
              <div key={log.id || index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.2fr 0.8fr 1.5fr 1fr 1.2fr 0.8fr', 
                gap: '16px', 
                padding: '12px', 
                borderBottom: '1px solid rgba(0, 149, 255, 0.1)', 
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '14px' }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                </div>
                <div style={{ fontSize: '14px', color: getTypeColor(log.type) }}>
                  {getTypeLabel(log.type)}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {getOperationLabel(log.operation)}
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {formatIP(log.ip_address)}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {getOSFromUserAgent(log.user_agent)}
                </div>
                <div style={{ fontSize: '14px' }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={() => {
                      alert(JSON.stringify(log.details || {}, null, 2))
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {!loading && logs.length > 0 && (
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
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              上一页
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              第 {page} 页 / 共 {Math.ceil(total / PAGE_SIZE)} 页
            </span>
            <button 
              className="btn btn-ghost" 
              disabled={logs.length < PAGE_SIZE}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>审计统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">总操作次数</span>
            <span className="stat-value">{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">用户操作</span>
            <span className="stat-value">{logs.filter(l => l.type === 'user_action').length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">系统行为</span>
            <span className="stat-value">{logs.filter(l => l.type === 'system_action').length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
