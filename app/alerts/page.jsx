'use client'
import { useState, useEffect } from 'react'
import { apiGet } from '../../lib/api'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let ok = true
    apiGet('api/alerts', { skip: 0, limit: 500 })
      .then((data) => { if (ok) setAlerts(Array.isArray(data) ? data : []) })
      .catch((e) => { if (ok) setError(e.message || '获取失败') })
    return () => { ok = false }
  }, [])

  const filtered = typeFilter
    ? alerts.filter((a) => a.alert_type === typeFilter)
    : alerts

  return (
    <div>
      <div className="glass" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>提醒记录</h2>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', minWidth: '120px' }}
        >
          <option value="">全部</option>
          <option value="微信">微信</option>
          <option value="短信">短信</option>
          <option value="邮件">邮件</option>
        </select>
      </div>
      {error && <div className="alert" style={{ background: 'rgba(255,77,79,0.15)' }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>信号ID</th>
              <th>类型</th>
              <th>状态</th>
              <th>邮箱</th>
              <th>邮件状态</th>
              <th>内容</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.signal_id}</td>
                <td>{a.alert_type}</td>
                <td>
                  <span className={`tag ${a.status === '已发送' ? 'tag-success' : a.status === '发送中' ? 'tag-info' : 'tag-danger'}`}>
                    {a.status}
                  </span>
                </td>
                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.email}>{a.email || '-'}</td>
                <td>
                  <span className={`tag ${a.email_status && a.email_status.includes('成功') ? 'tag-success' : a.email_status ? 'tag-danger' : 'tag-info'}`}>
                    {a.email_status || '-'}
                  </span>
                </td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.message}>{a.message}</td>
                <td>{a.created_at ? String(a.created_at).slice(0, 19).replace('T', ' ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无提醒</div>}
      </div>
    </div>
  )
}
