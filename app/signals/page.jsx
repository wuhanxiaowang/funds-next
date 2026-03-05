'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiGet } from '../../lib/api'

function SignalsContent() {
  const searchParams = useSearchParams()
  const newsId = searchParams.get('news_id')
  
  const [signals, setSignals] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let ok = true
    apiGet('api/signals', { skip: 0, limit: 500 })
      .then((data) => { if (ok) setSignals(Array.isArray(data) ? data : []) })
      .catch((e) => { if (ok) setError(e.message || '获取失败') })
    return () => { ok = false }
  }, [])

  const filtered = signals.filter((s) => {
    // 按新闻ID过滤
    if (newsId && s.news_id != newsId) {
      return false
    }
    
    // 按搜索关键词过滤
    const q = search.toLowerCase()
    return (s.event && s.event.toLowerCase().includes(q)) ||
      (s.asset_class && s.asset_class.toLowerCase().includes(q)) ||
      (s.operation && s.operation.toLowerCase().includes(q)) ||
      (!q && true) // 如果没有搜索关键词，返回所有结果
  })

  const dirType = (d) => (d === '涨' ? 'tag-success' : d === '跌' ? 'tag-danger' : 'tag-info')

  return (
    <div>
      <div className="glass" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>投资信号</h2>
        <input
          type="text"
          placeholder="搜索信号"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-group input"
          style={{ width: '260px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)' }}
        />
      </div>
      {error && <div className="alert" style={{ background: 'rgba(255,77,79,0.15)' }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>事件</th>
              <th>资产类型</th>
              <th>方向</th>
              <th>概率</th>
              <th>周期</th>
              <th>强度</th>
              <th>操作</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.event}</td>
                <td>{s.asset_class}</td>
                <td><span className={`tag ${dirType(s.direction)}`}>{s.direction}</span></td>
                <td>{s.probability != null ? `${s.probability}%` : '-'}</td>
                <td>{s.period || '-'}</td>
                <td>{s.strength != null ? s.strength : '-'}</td>
                <td>{s.operation || '-'}</td>
                <td>{s.created_at ? String(s.created_at).slice(0, 19).replace('T', ' ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无信号</div>}
      </div>
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
