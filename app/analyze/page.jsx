'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiGet, apiPost } from '../../lib/api'

function AnalyzeContent() {
  const searchParams = useSearchParams()
  const autoStart = searchParams.get('autoStart') === 'true'
  
  const [status, setStatus] = useState({
    isRunning: false,
    currentStep: '',
    progress: 0,
    totalSteps: 5,
    message: '',
    startTime: null,
    endTime: null,
    result: null,
    currentNews: null
  })
  const [refreshing, setRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [autoStarted, setAutoStarted] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [historyExpanded, setHistoryExpanded] = useState(true)

  const fetchStatus = async () => {
    try {
      const data = await apiGet('api/analyze/status')
      const previousRunning = status.isRunning
      setStatus(data)
      
      // 当分析从运行状态变为非运行状态时，更新历史记录
      if (previousRunning && !data.isRunning && data.result) {
        fetchAnalysisHistory()
      }
    } catch (e) {
      console.error('获取分析状态失败:', e)
    }
  }

  const runAnalysis = async () => {
    setErrorMsg('')
    setRefreshing(true)
    try {
      await apiPost('api/analyze/run', null, { page_size: 1 })
      // 立即获取状态
      await fetchStatus()
      
      // 分析过程中每2秒检查一次状态，直到分析完成
      const checkStatusLoop = async () => {
        const currentStatus = await apiGet('api/analyze/status')
        setStatus(currentStatus)
        
        // 如果分析还在运行，继续检查
        if (currentStatus.isRunning) {
          setTimeout(checkStatusLoop, 2000)
        } else {
          // 分析完成，更新历史记录
          fetchAnalysisHistory()
          setRefreshing(false)
        }
      }
      
      // 启动状态检查循环
      setTimeout(checkStatusLoop, 2000)
    } catch (e) {
      console.error('启动分析失败:', e)
      setErrorMsg(e?.message || '启动分析失败，请查看控制台或检查接口配置')
      setRefreshing(false)
    }
  }

  const stopAnalysis = async () => {
    try {
      await fetch('/api/analyze/status', {
        method: 'DELETE'
      })
      // 手动获取状态
      fetchStatus()
    } catch (e) {
      console.error('停止分析失败:', e)
    }
  }

  const resetStatus = async () => {
    try {
      await fetch('/api/analyze/status', {
        method: 'DELETE'
      })
      // 手动获取状态
      fetchStatus()
    } catch (e) {
      console.error('重置状态失败:', e)
    }
  }

  const fetchAnalysisHistory = async () => {
    try {
      const data = await apiGet('api/signals', { limit: 20 })
      setAnalysisHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('获取分析历史失败:', e)
    }
  }

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 页面可见性API，只在页面可见时加载数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const init = async () => {
          await fetchStatus()
          await fetchAnalysisHistory()
        }
        init()
      }
    }
    
    // 初始加载
    const init = async () => {
      await fetchStatus()
      await fetchAnalysisHistory()
    }
    init()
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 当检测到正在分析时，恢复状态轮询
  useEffect(() => {
    if (status.isRunning && !refreshing) {
      // 恢复轮询
      const checkStatusLoop = async () => {
        try {
          const currentStatus = await apiGet('api/analyze/status')
          setStatus(currentStatus)
          
          // 如果分析还在运行，继续检查
          if (currentStatus.isRunning) {
            setTimeout(checkStatusLoop, 2000)
          } else {
            // 分析完成，更新历史记录
            fetchAnalysisHistory()
          }
        } catch (e) {
          console.error('轮询状态失败:', e)
        }
      }
      
      // 启动状态检查循环
      const timer = setTimeout(checkStatusLoop, 2000)
      return () => clearTimeout(timer)
    }
  }, [status.isRunning, refreshing])

  // 自动启动分析（从监控页面跳转过来时）
  useEffect(() => {
    if (autoStart && !autoStarted && !status.isRunning) {
      setAutoStarted(true)
      runAnalysis()
    }
  }, [autoStart, autoStarted, status.isRunning, runAnalysis])

  return (
    <div>
      <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>分析状态</span>
            <span className={`tag ${status.isRunning ? 'tag-warning' : 'tag-success'}`} style={{ padding: '4px 10px', borderRadius: '6px' }}>
              {status.isRunning ? '分析中' : '就绪'}
            </span>
          </div>
          {errorMsg && (
            <div style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.4)', borderRadius: '8px', fontSize: '13px', color: 'var(--danger, #f55)' }}>
              {errorMsg}
            </div>
          )}
          <div className="actions-row">
            <button className="btn btn-primary" onClick={runAnalysis} disabled={status.isRunning || refreshing}>
              {status.isRunning ? '分析中...' : refreshing ? '启动中...' : '开始分析'}
            </button>
            {status.isRunning && (
              <button className="btn btn-danger" onClick={stopAnalysis}>
                停止分析
              </button>
            )}
            {!status.isRunning && status.progress > 0 && (
              <button className="btn btn-ghost" onClick={resetStatus}>
                重置状态
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>分析进度</h3>
        
        {/* 进度条 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">当前进度</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{status.progress}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: 'rgba(0, 149, 255, 0.2)', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${status.progress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              boxShadow: '0 0 10px var(--primary-glow)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* 状态信息 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span className="stat-title">当前步骤</span>
          </div>
          <div style={{ 
            padding: '12px', 
            background: 'rgba(0, 149, 255, 0.1)', 
            border: '1px solid rgba(0, 149, 255, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {status.currentStep || '未开始'}
          </div>
        </div>

        {/* 状态消息 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span className="stat-title">状态消息</span>
          </div>
          <div style={{ 
            padding: '12px', 
            background: 'rgba(0, 149, 255, 0.05)', 
            border: '1px solid rgba(0, 149, 255, 0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px'
          }}>
            {status.message || '准备就绪'}
          </div>
        </div>

        {/* 当前分析的新闻 */}
        {status.currentNews && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span className="stat-title">分析中的新闻</span>
            </div>
            <div style={{ 
              padding: '16px', 
              background: 'rgba(0, 149, 255, 0.05)', 
              border: '1px solid rgba(0, 149, 255, 0.2)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                {status.currentNews.title}
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '13px', 
                color: 'var(--text-muted)', 
                lineHeight: '1.4'
              }}>
                {status.currentNews.content}
              </p>
            </div>
          </div>
        )}

        {/* 时间信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {status.startTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-title">开始时间</span>
              <span style={{ fontSize: '14px' }}>{new Date(status.startTime).toLocaleString()}</span>
            </div>
          )}
          {status.endTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-title">结束时间</span>
              <span style={{ fontSize: '14px' }}>{new Date(status.endTime).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* 大模型调用过程 */}
        {Array.isArray(status.llmCalls) && status.llmCalls.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(0, 149, 255, 0.2)' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>大模型调用过程</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              每条新闻会调用一次大模型（豆包/DeepSeek/OpenAI 等）提取投资信号，下方为本次分析的调用记录。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {status.llmCalls.map((call, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    background: 'rgba(0, 149, 255, 0.06)',
                    border: '1px solid rgba(0, 149, 255, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--primary)' }}>
                    {idx + 1}. {call.title || '无标题'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                    <span>模型: {call.model}</span>
                    <span>耗时: {call.durationMs}ms</span>
                    <span>输入: {call.inputChars} 字</span>
                    <span>解析: {call.event} · {call.asset_class} {call.direction} · 强度{call.strength}</span>
                  </div>
                  {call.outputSnippet && (
                    <div style={{ marginTop: '6px', color: 'var(--text)', lineHeight: 1.4 }}>
                      <span className="stat-title">大模型输出摘要: </span>
                      {call.outputSnippet}
                      {(call.outputSnippet || '').length >= 280 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分析结果 */}
        {status.result && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(0, 149, 255, 0.2)' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>分析结果</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0, 149, 255, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>新闻数量</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{status.result.news_count}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>信号数量</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>{status.result.signal_count}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>提醒数量</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)' }}>{status.result.alert_count}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分析历史记录 */}
      <div className="glass" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>分析历史记录</h3>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '4px 12px', fontSize: '12px' }}
            onClick={() => setHistoryExpanded(!historyExpanded)}
          >
            {historyExpanded ? '收起' : '展开'}
          </button>
        </div>
        {historyExpanded && (
          <>
            {analysisHistory.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无分析历史</div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {analysisHistory.map((item, index) => {
                  const isExpanded = expandedItems.has(item.id)
                  return (
                    <div key={item.id || index} style={{ 
                      padding: '12px', 
                      borderBottom: '1px solid rgba(0, 149, 255, 0.1)', 
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }} onClick={() => toggleExpand(item.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>信号 #{item.id}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                          </span>
                          <span style={{ 
                            fontSize: '10px', 
                            color: 'var(--primary)',
                            transition: 'transform 0.3s ease'
                          }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        <span className="tag" style={{ padding: '2px 8px', fontSize: '12px', background: 'rgba(0, 149, 255, 0.1)' }}>
                          {item.event || '未知事件'}
                        </span>
                        <span className="tag" style={{ padding: '2px 8px', fontSize: '12px', background: 'rgba(0, 255, 136, 0.1)' }}>
                          {item.asset_class || '未知资产'}
                        </span>
                        <span className={`tag ${item.direction === 'up' ? 'tag-success' : 'tag-danger'}`} style={{ padding: '2px 8px', fontSize: '12px' }}>
                          {item.direction === 'up' ? '看多' : '看空'}
                        </span>
                        <span className="tag" style={{ padding: '2px 8px', fontSize: '12px', background: 'rgba(255, 170, 0, 0.1)' }}>
                          强度 {item.strength || 0}
                        </span>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 149, 255, 0.1)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <span className="tag" style={{ padding: '2px 8px', fontSize: '12px', background: 'rgba(153, 102, 255, 0.1)' }}>
                              概率 {item.probability || '0%'}
                            </span>
                            <span className="tag" style={{ padding: '2px 8px', fontSize: '12px', background: 'rgba(255, 159, 64, 0.1)' }}>
                              周期 {item.period || '无'}
                            </span>
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>分析逻辑：</div>
                            <p style={{ 
                              margin: '0', 
                              fontSize: '13px', 
                              color: 'var(--text-muted)', 
                              lineHeight: '1.4'
                            }}>
                              {item.logic || '无分析逻辑'}
                            </p>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>操作建议：</div>
                            <p style={{ 
                              margin: '0', 
                              fontSize: '13px', 
                              color: 'var(--primary)', 
                              lineHeight: '1.4',
                              fontWeight: 500
                            }}>
                              {item.operation || '无操作'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>加载中...</div>}>
      <AnalyzeContent />
    </Suspense>
  )
}