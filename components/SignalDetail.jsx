'use client'
import { useState } from 'react'

export default function SignalDetail({ signal, onClose }) {
  if (!signal) return null

  const [result, setResult] = useState('')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)

  const dirType = (d) => {
    if (d === '涨') return { bg: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }
    if (d === '跌') return { bg: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', border: '1px solid rgba(255, 77, 79, 0.3)' }
    return { bg: 'rgba(0, 149, 255, 0.2)', color: '#00c3ff', border: '1px solid rgba(0, 149, 255, 0.3)' }
  }

  const getStrengthColor = (strength) => {
    if (strength >= 8) return '#ff4d4f'
    if (strength >= 5) return '#ffa940'
    if (strength >= 3) return '#00c3ff'
    return '#52c41a'
  }

  const dirStyle = dirType(signal.direction)

  const saveResult = async () => {
    if (!result) return
    setSaving(true)
    try {
      // 这里可以调用API保存结果
      console.log('保存信号结果:', { signalId: signal.id, result, remark })
      // 模拟保存成功
      setTimeout(() => {
        setSaving(false)
        alert('标记成功')
      }, 1000)
    } catch (e) {
      setSaving(false)
      alert('保存失败: ' + (e.message || ''))
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(36, 59, 85, 0.95) 100%)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* 头部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>信号详情</h2>
          <button onClick={onClose} style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px'
          }}>×</button>
        </div>

        {/* 核心信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* 事件 */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>事件</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{signal.event || '-'}</div>
          </div>

          {/* 资产类型 */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>资产类型</div>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>{signal.asset_class || '-'}</div>
          </div>

          {/* 方向 */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>方向</div>
            <span style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              ...dirStyle
            }}>
              {signal.direction || '-'}
            </span>
          </div>

          {/* 强度 */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>强度</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '60px',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(signal.strength || 0) * 10}%`,
                  height: '100%',
                  background: getStrengthColor(signal.strength || 0),
                  borderRadius: '4px'
                }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: getStrengthColor(signal.strength || 0) }}>
                {signal.strength || 0}
              </span>
            </div>
          </div>

          {/* 概率 */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>概率</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#00ff88' }}>
              {signal.probability != null ? `${signal.probability}%` : '-'}
            </div>
          </div>

          {/* 周期 */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>周期</div>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>{signal.period || '-'}</div>
          </div>

          {/* 操作建议 */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>操作建议</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffa940' }}>{signal.operation || '-'}</div>
          </div>
        </div>

        {/* 逻辑分析 */}
        {signal.logic && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>逻辑分析</div>
            <div style={{
              background: 'rgba(0, 149, 255, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              border: '1px solid rgba(0, 149, 255, 0.2)'
            }}>
              {signal.logic}
            </div>
          </div>
        )}

        {/* 新闻溯源 */}
        {signal.news && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              📰 关联新闻
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
              {signal.news.title || '无标题'}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              lineHeight: '1.6',
              marginBottom: '8px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {signal.news.content || '无内容'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                来源：{signal.news.source || '未知'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {signal.news.published_at ? new Date(signal.news.published_at).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        )}

        {/* 手动标记信号结果 */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>标记信号结果</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>结果</div>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">请选择结果</option>
                <option value="success">成功</option>
                <option value="partial">部分成功</option>
                <option value="failed">失败</option>
                <option value="pending">待定</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>备注</div>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                placeholder="请输入备注信息..."
              />
            </div>
          </div>
          <button
            onClick={saveResult}
            disabled={!result || saving}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              background: '#00c3ff',
              color: '#000',
              fontSize: '14px',
              fontWeight: '600',
              cursor: !result || saving ? 'not-allowed' : 'pointer',
              opacity: !result || saving ? 0.6 : 1
            }}
          >
            {saving ? '保存中...' : '保存结果'}
          </button>
        </div>

        {/* 时间信息 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>信号ID: {signal.id}</span>
          <span>生成时间: {signal.created_at ? new Date(signal.created_at).toLocaleString() : '-'}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
