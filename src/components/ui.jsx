import React from 'react'

export function Card({ children, className = '' }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--rl2)', padding: '18px 22px',
      boxShadow: 'var(--sh)', marginBottom: 14,
    }} className={`card-body${className ? ' ' + className : ''}`}>
      {children}
    </div>
  )
}

export function CardTitle({ icon: Icon, children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: 'var(--t3)',
      marginBottom: 13, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {Icon && <Icon size={13} />}
      {children}
    </div>
  )
}

export function Field({ label, children, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', letterSpacing: '0.02em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  padding: '8px 10px', border: '1px solid var(--border-mid)',
  borderRadius: 8, background: 'var(--bg)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  color: 'var(--text)', transition: 'border-color 0.12s, box-shadow 0.12s',
  outline: 'none', width: '100%',
}

export function Input({ style, ...props }) {
  const [focused, setFocused] = React.useState(false)
  return (
    <input
      style={{
        ...inputStyle,
        ...(focused ? { borderColor: 'var(--purple)', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)', background: 'var(--surface)' } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

export function Select({ style, ...props }) {
  return <select style={{ ...inputStyle, ...style }} {...props} />
}

export function Textarea({ style, ...props }) {
  const [focused, setFocused] = React.useState(false)
  return (
    <textarea
      style={{
        ...inputStyle, resize: 'vertical',
        ...(focused ? { borderColor: 'var(--purple)', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)', background: 'var(--surface)' } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

export function Btn({ variant = 'primary', full, children, style, disabled, ...props }) {
  const [hovered, setHovered] = React.useState(false)
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 15px', borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s', border: '1px solid transparent',
    whiteSpace: 'nowrap', width: full ? '100%' : undefined,
    opacity: disabled ? 0.4 : 1,
  }
  const variants = {
    primary:   { background: 'var(--text)', color: 'var(--surface)', boxShadow: 'var(--sh)' },
    secondary: { background: 'var(--surface)', color: 'var(--t2)', borderColor: 'var(--border-mid)', boxShadow: 'var(--sh)' },
    ghost:     { background: 'transparent', color: 'var(--t2)', borderColor: 'transparent' },
  }
  const hoverVariants = {
    primary:   { background: '#2D2B28' },
    secondary: { background: 'var(--surface2)', borderColor: 'var(--border-mid)' },
    ghost:     { background: 'var(--surface2)' },
  }
  return (
    <button
      style={{ ...base, ...variants[variant], ...(hovered && !disabled ? hoverVariants[variant] : {}), ...style }}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ variant = 'purple', children }) {
  const variants = {
    purple: { background: 'var(--pl)', color: 'var(--purple)' },
    green: { background: 'var(--gl)', color: 'var(--green)' },
    amber: { background: 'var(--al)', color: 'var(--amber)' },
    red: { background: 'var(--rl)', color: 'var(--red)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 10,
      fontSize: 10, fontWeight: 600,
      letterSpacing: '0.03em', textTransform: 'uppercase',
      ...variants[variant],
    }}>
      {children}
    </span>
  )
}

export function Spinner({ size = 14 }) {
  return (
    <span style={{
      width: size, height: size,
      border: '2px solid var(--border-mid)',
      borderTopColor: 'var(--text)',
      borderRadius: '50%',
      display: 'inline-block',
      flexShrink: 0,
      animation: 'spin 0.65s linear infinite',
    }} />
  )
}

export function Alert({ variant = 'amber', children }) {
  const variants = {
    amber: { background: 'var(--al)', border: '1px solid #FCD34D', color: '#92400E' },
    purple: { background: 'var(--pl)', border: '1px solid var(--pm)', color: 'var(--pd)' },
    green: { background: 'var(--gl)', border: '1px solid #6EE7B7', color: '#065F46' },
  }
  return (
    <div style={{
      borderRadius: 'var(--r)', padding: '11px 15px',
      fontSize: 12, marginBottom: 14,
      display: 'flex', gap: 10, alignItems: 'flex-start',
      ...variants[variant],
    }}>
      {children}
    </div>
  )
}

export function Divider({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '16px 0', fontSize: 11, color: 'var(--t3)',
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {label}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export function FormGrid({ cols = 2, children, style }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 10, marginBottom: 10, ...style,
    }}
    className="responsive-form-grid"
    data-cols={cols}
    >
      {children}
    </div>
  )
}
