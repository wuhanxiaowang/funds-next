'use client'
import { ButtonLoading } from './Loading'

export default function EnhancedButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
  loadingText = '处理中...',
  ...props
}) {
  const isDisabled = disabled || loading
  
  const sizeStyles = {
    small: {
      padding: '8px 16px',
      fontSize: '12px'
    },
    medium: {
      padding: '10px 20px',
      fontSize: '14px'
    },
    large: {
      padding: '12px 24px',
      fontSize: '16px'
    }
  }
  
  const variantStyles = {
    primary: {
      background: 'var(--primary)',
      color: '#001020',
      boxShadow: '0 4px 15px var(--primary-glow)',
      border: 'none'
    },
    success: {
      background: 'var(--success)',
      color: '#001020',
      boxShadow: '0 4px 15px rgba(0, 255, 136, 0.4)',
      border: 'none'
    },
    warning: {
      background: 'var(--warning)',
      color: '#001020',
      boxShadow: '0 4px 15px rgba(255, 170, 0, 0.4)',
      border: 'none'
    },
    ghost: {
      background: 'rgba(0, 149, 255, 0.2)',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
      boxShadow: '0 2px 10px var(--primary-glow)'
    },
    danger: {
      background: 'linear-gradient(135deg, #ff4444 0%, #ff2222 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 15px rgba(255, 68, 68, 0.5)',
      border: '1px solid rgba(255, 100, 100, 0.5)'
    }
  }
  
  const buttonStyle = {
    ...sizeStyles[size] || sizeStyles.medium,
    ...variantStyles[variant] || variantStyles.primary,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    opacity: isDisabled ? 0.6 : 1
  }
  
  const handleClick = (e) => {
    if (!isDisabled && onClick) {
      onClick(e)
    }
  }
  
  return (
    <button
      style={buttonStyle}
      onClick={handleClick}
      disabled={isDisabled}
      className={`enhanced-button ${className}`}
      {...props}
    >
      {loading ? (
        <ButtonLoading text={loadingText} size={size} />
      ) : (
        children
      )}
      <style jsx>{`
        .enhanced-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        
        .enhanced-button:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .enhanced-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--primary-glow);
        }
      `}</style>
    </button>
  )
}

// 快捷按钮变体
export function PrimaryButton(props) {
  return <EnhancedButton variant="primary" {...props} />
}

export function SuccessButton(props) {
  return <EnhancedButton variant="success" {...props} />
}

export function WarningButton(props) {
  return <EnhancedButton variant="warning" {...props} />
}

export function GhostButton(props) {
  return <EnhancedButton variant="ghost" {...props} />
}

export function DangerButton(props) {
  return <EnhancedButton variant="danger" {...props} />
}