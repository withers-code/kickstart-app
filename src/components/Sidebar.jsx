import React from 'react'
import { Zap, FileText, Info, Settings } from 'lucide-react'

const NAV = [
  { id: 'generate', label: 'Generate documents', Icon: FileText },
  { id: 'guide', label: 'How to use', Icon: Info },
  { id: 'settings', label: 'API & settings', Icon: Settings },
]

export default function Sidebar({ page, setPage }) {
  return (
    <nav style={{
      width: 232, minWidth: 232,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '16px 16px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border)',
        marginBottom: 10,
      }}>
        <div style={{
          width: 30, height: 30, background: 'var(--text)',
          borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Zap size={15} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>Sprint Reply</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kickstart</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '0 8px', marginBottom: 18 }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)', padding: '0 8px', marginBottom: 4, display: 'block' }}>
          Workspace
        </span>
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13,
              fontWeight: page === id ? 500 : 400,
              color: page === id ? 'var(--purple)' : 'var(--t2)',
              background: page === id ? 'var(--pl)' : 'transparent',
              transition: 'all 0.12s',
              border: 'none', width: '100%', textAlign: 'left',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '14px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
        v2.0 · May 2026<br />
        AI &amp; Process Automation<br />
        Sprint Reply Internal
      </div>
    </nav>
  )
}
