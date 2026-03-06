'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiGet } from '../../lib/api'
import SignalDetail from '../../components/SignalDetail'

function SignalsContent() {
  const searchParams = useSearchParams()
  const newsId = searchParams.get('news_id')
  const filter = searchParams.get('filter')
  
  const [signals, setSignals] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let ok = true
    apiGet('api/signals', { skip: 0, limit: 1000, include_news: true })
      .then((data) => { if (ok) setSignals(Array.isArray(data) ? data : []) })
      .catch((e) => { if (ok) setError(e.message || '获取失败') })
    return () => { ok = false }
  }, [filter])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        let ok = true
        apiGet('api/signals', { skip: 0, limit: 1000, include_news: true })
          .then((data) => { if (ok) setSignals(Array.isArray(data) ? data : []) })
          .catch((e) => { if (ok) setError(e.message || '获取失败') })
        return () => { ok = false }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [filter])

  // 过滤信号
  const filtered = signals.filter((s) => {
    if (newsId && s.news_id != newsId) return false
    if (filter === 'valid') {
      return s.direction && s.direction !== '无影响' && s.direction !== '无' && s.strength > 0
    }
    const q = search.toLowerCase()
    return (s.event && s.event.toLowerCase().includes(q)) ||
      (s.asset_class && s.asset_class.toLowerCase().includes(q)) ||
      (s.operation && s.operation.toLowerCase().includes(q)) ||
      (!q && true)
  })

  // 分页计算
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedSignals = filtered.slice(startIndex, endIndex)

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter, newsId])

  const getDirStyle = (d) => {
    if (d === '涨') return { bg: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }
    if (d === '跌') return { bg: 'rgba(255, 77, 79, 0.15)', color: '#ff4d4f', border: '1px solid rgba(255, 77, 79, 0.3)' }
    return { bg: 'rgba(0, 149, 255, 0.15)', color: '#00c3ff', border: '1px solid rgba(0, 149, 255, 0.3)' }
  }

  const getStrengthColor = (s) => {
    if (s >= 8) return '#ff4d4f'
    if (s >= 5) return '#ffa940'
    if (s >= 3) return '#00c3ff'
    return '#52c41a'
  }

  const truncate = (text, maxLen) => {
    if (!text) return '-'
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  }

  // 生成分页页码
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 头部 */}
      <div className="glass" style={{ 
        padding: '20px 24px', 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        borderRadius: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>投资信号</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            共 {totalCount} 条信号
            {filter === 'valid' && ' · 仅显示有效信号'}
          </p>
        </div>
        <input
          type="text"
          placeholder="搜索事件、资产类型..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '260px', 
            padding: '10px 16px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.15)', 
            background: 'rgba(0,0,0,0.2)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {error && (
        <div style={{ 
          padding: '14px 18px', 
          background: 'rgba(255,77,79,0.15)', 
          borderRadius: '10px',
          marginBottom: '16px',
          border: '1px solid rgba(255,77,79,0.3)'
        }}>
          {error}
        </div>
      )}

      {/* 表头 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 100px 70px 60px 80px 70px 70px 90px 70px',
        gap: '16px',
        padding: '12px 20px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: 500,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '8px'
      }}>
        <div>事件</div>
        <div style={{ textAlign: 'center' }}>资产类型</div>
        <div style={{ textAlign: 'center' }}>方向</div>
        <div style={{ textAlign: 'center' }}>概率</div>
        <div style={{ textAlign: 'center' }}>周期</div>
        <div style={{ textAlign: 'center' }}>强度</div>
        <div style={{ textAlign: 'center' }}>操作</div>
        <div style={{ textAlign: 'right' }}>时间</div>
        <div style={{ textAlign: 'center' }}>详情</div>
      </div>

      {/* 信号列表 */}
      {paginatedSignals.length === 0 ? (
        <div style={{ 
          padding: '50px', 
          textAlign: 'center', 
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '14px' }}>暂无信号数据</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {paginatedSignals.map((s) => {
            const dirStyle = getDirStyle(s.direction)
            const strengthColor = getStrengthColor(s.strength || 0)
            return (
              <div key={s.id}>
                {/* 主行 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 100px 70px 60px 80px 70px 70px 90px 70px',
                    gap: '16px',
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(0, 149, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  {/* 事件 */}
                  <div style={{ minWidth: 0 }}>
                    <span 
                      style={{ 
                        fontSize: '14px', 
                        fontWeight: 500, 
                        color: '#fff',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        lineHeight: '1.4',
                        display: 'block',
                        maxWidth: '100%'
                      }} 
                      title={s.event}
                    >
                      {s.event || '-'}
                    </span>
                  </div>

                  {/* 资产类型 */}
                  <div style={{ textAlign: 'center' }}>
                    <span 
                      style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-muted)',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        lineHeight: '1.4',
                        display: 'block',
                        width: '100%'
                      }}
                      title={s.asset_class}
                    >
                      {s.asset_class || '-'}
                    </span>
                  </div>

                  {/* 方向 */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      ...dirStyle
                    }} title={s.direction}>
                      {s.direction || '-'}
                    </span>
                  </div>

                  {/* 概率 */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: s.probability >= 70 ? '#00ff88' : s.probability >= 50 ? '#ffa940' : '#fff',
                      whiteSpace: 'nowrap'
                    }}>
                      {s.probability != null ? `${s.probability}%` : '-'}
                    </span>
                  </div>

                  {/* 周期 */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      width: '100%'
                    }} title={s.period}>
                      {truncate(s.period, 6)}
                    </span>
                  </div>

                  {/* 强度 */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min((s.strength || 0) * 10, 100)}%`,
                          height: '100%',
                          background: strengthColor,
                          borderRadius: '2px'
                        }} />
                      </div>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: strengthColor,
                      }}>
                        {s.strength || 0}
                      </span>
                    </div>
                  </div>

                  {/* 操作 */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 500, 
                      color: '#ffa940',
                      whiteSpace: 'nowrap'
                    }}>
                      {s.operation || '-'}
                    </span>
                  </div>

                  {/* 时间 */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}>
                      {s.created_at 
                        ? new Date(s.created_at).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).replace(/\//g, '/')
                        : '-'
                      }
                    </span>
                  </div>

                  {/* 详情按钮 */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSignal(s)
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 149, 255, 0.4)',
                        background: 'rgba(0, 149, 255, 0.15)',
                        color: '#00c3ff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
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
                      查看
                    </button>
                  </div>
                </div>

                {/* 关联新闻行 */}
                {s.news && (
                  <div style={{ 
                    padding: '6px 20px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}>
                    <span style={{ color: '#00c3ff', flexShrink: 0 }}>📰</span>
                    <span 
                      style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        maxWidth: 'calc(100% - 30px)'
                      }} 
                      title={s.news.title}
                    >
                      {truncate(s.news.title, 10)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px'
        }}>
          {/* 每页条数选择 */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              marginRight: '16px'
            }}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>

          {/* 上一页 */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              color: currentPage === 1 ? 'var(--text-muted)' : '#fff',
              fontSize: '13px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            上一页
          </button>

          {/* 页码 */}
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: currentPage === page ? 'rgba(0, 149, 255, 0.3)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: currentPage === page ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {page}
            </button>
          ))}

          {/* 下一页 */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              color: currentPage === totalPages ? 'var(--text-muted)' : '#fff',
              fontSize: '13px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            下一页
          </button>

          {/* 页码信息 */}
          <span style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginLeft: '12px'
          }}>
            {startIndex + 1}-{Math.min(endIndex, totalCount)} / {totalCount} 条
          </span>
        </div>
      )}

      {/* 信号详情模态框 */}
      {selectedSignal && (
        <SignalDetail 
          signal={selectedSignal} 
          onClose={() => setSelectedSignal(null)} 
        />
      )}
    </div>
  )
}

export default function SignalsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>加载中...</div>}>
      <SignalsContent />
    </Suspense>
  )
}
