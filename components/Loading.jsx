'use client'

// 加载动画组件
export function LoadingSpinner({ size = 24, color = 'var(--primary)', className = '' }) {
  return (
    <div className={`loading-spinner ${className}`} style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: size,
        height: size,
        border: `2px solid rgba(0, 149, 255, 0.3)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
  )
}

// 加载骨架屏组件
export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) {
  return (
    <div className={`skeleton ${className}`} style={{
      width,
      height,
      background: 'linear-gradient(90deg, rgba(0, 149, 255, 0.1) 25%, rgba(0, 149, 255, 0.2) 50%, rgba(0, 149, 255, 0.1) 75%)',
      backgroundSize: '200% 100%',
      borderRadius,
      animation: 'shimmer 1.5s infinite'
    }} />
  )
}

// 数据卡片骨架屏
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`card-skeleton ${className}`} style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 149, 255, 0.2)',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Skeleton height="24px" width="80%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="90%" />
      <Skeleton height="16px" width="70%" />
    </div>
  )
}

// 按钮加载状态
export function ButtonLoading({ text = '处理中...', size = 'small' }) {
  const sizes = {
    small: { fontSize: '12px', spinnerSize: 16 },
    medium: { fontSize: '14px', spinnerSize: 18 },
    large: { fontSize: '16px', spinnerSize: 20 }
  }
  
  const style = sizes[size] || sizes.medium
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: style.fontSize
    }}>
      <LoadingSpinner size={style.spinnerSize} />
      <span>{text}</span>
    </div>
  )
}

// 全屏加载覆盖层
export function FullScreenLoading({ text = '加载中...' }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 10, 20, 0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <LoadingSpinner size={48} />
      <div style={{
        marginTop: '16px',
        fontSize: '16px',
        color: 'var(--text)'
      }}>
        {text}
      </div>
    </div>
  )
}

// 内联样式添加动画
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`
document.head.appendChild(style)