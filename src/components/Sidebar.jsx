import React from 'react'
import { FileText, Info, Settings, SlidersHorizontal, LogOut } from 'lucide-react'
import { AUTH_ENABLED, signOut } from '../lib/auth.js'

const NAV = [
  { id: 'generate', label: 'Generate documents', Icon: FileText },
  { id: 'instructions', label: 'Custom instructions', Icon: SlidersHorizontal },
  { id: 'guide', label: 'How to use', Icon: Info },
  { id: 'settings', label: 'API & settings', Icon: Settings },
]

function KickstartLogo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="7" fill="#0F172A"/>
      <path
        d="M9 7v16M9 15l10-8M9 15l10 8"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M23 5.5L23.78 7.22L25.5 8L23.78 8.78L23 10.5L22.22 8.78L20.5 8L22.22 7.22Z"
        fill="#F59E0B"
      />
    </svg>
  )
}

export default function Sidebar({ page, setPage, sidebarOpen, account, onSignOut }) {
  async function handleSignOut() {
    try { await signOut(account) } catch {}
    if (onSignOut) onSignOut()
  }

  const displayName = account?.name || account?.username || ''
  const initials = displayName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <nav data-open={sidebarOpen} style={{
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
        <KickstartLogo size={30} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Kickstart</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.02em', marginTop: 1 }}>Project artefact generator</div>
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
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
        {AUTH_ENABLED && account && (
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pl)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.username}</div>
            </div>
            <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, flexShrink: 0 }}>
              <LogOut size={14} />
            </button>
          </div>
        )}
        <div style={{ padding: '8px 16px 14px', fontSize: 11, color: 'var(--t3)' }}>
          v2.0 · May 2026
        </div>
      </div>
    </nav>
  )
}
