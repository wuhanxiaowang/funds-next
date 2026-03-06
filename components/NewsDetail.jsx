'use client'

export default function NewsDetail({ news, onClose }) {
  if (!news) return null

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      style={{
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
        animation: 'fadeIn 0.3s ease',
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(145deg, rgba(20, 30, 48, 0.98) 0%, rgba(36, 59, 85, 0.98) 100%)',
          borderRadius: '16px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>📰</span>
              <span style={{ 
                fontSize: '11px', 
                color: '#00c3ff',
                background: 'rgba(0, 195, 255, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 195, 255, 0.2)'
              }}>
                {news.source || '新闻'}
              </span>
              {news.analyzed ? (
                <span style={{ 
                  fontSize: '11px', 
                  color: '#00ff88',
                  background: 'rgba(0, 255, 136, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 255, 136, 0.2)'
                }}>
                  已分析
                </span>
              ) : (
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  未分析
                </span>
              )}
            </div>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              margin: 0,
              lineHeight: '1.5',
              color: '#fff'
            }}>
              {news.title || '无标题'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 77, 79, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 77, 79, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            ×
          </button>
        </div>

        {/* 内容区 */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* 元信息 */}
          <div style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>发布时间</div>
              <div style={{ fontSize: '13px', color: '#fff' }}>{formatDate(news.published_at || news.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>采集时间</div>
              <div style={{ fontSize: '13px', color: '#fff' }}>{formatDate(news.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>新闻ID</div>
              <div style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace' }}>#{news.id}</div>
            </div>
          </div>

          {/* 正文 */}
          <div style={{
            fontSize: '14px',
            lineHeight: '1.8',
            color: 'rgba(255, 255, 255, 0.9)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {news.content || '无内容'}
          </div>
        </div>

        {/* 底部操作 */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
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
