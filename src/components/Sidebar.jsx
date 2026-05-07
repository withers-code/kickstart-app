import React, { useState, useMemo } from 'react'
import { Plus, Info, Settings, SlidersHorizontal, LogOut, X, Clock } from 'lucide-react'
import { AUTH_ENABLED, signOut } from '../lib/auth.js'
import pkg from '../../package.json'

const NAV = [
  { id: 'instructions', label: 'Custom instructions', Icon: SlidersHorizontal },
  { id: 'guide', label: 'How to use', Icon: Info },
  { id: 'settings', label: 'API & settings', Icon: Settings },
]

function KickstartLogo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="7" fill="#0F172A"/>
      <path d="M9 7v16M9 15l10-8M9 15l10 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 5.5L23.78 7.22L25.5 8L23.78 8.78L23 10.5L22.22 8.78L20.5 8L22.22 7.22Z" fill="#F59E0B" />
    </svg>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function Sidebar({ page, setPage, sidebarOpen, account, onSignOut, history = [], activeSessionId, onNewSession, onLoadHistory, onDeleteHistory }) {
  const [clientFilter, setClientFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function handleSignOut() {
    try { await signOut(account) } catch {}
    if (onSignOut) onSignOut()
  }

  const displayName = account?.name || account?.username || ''
  const initials = displayName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'

  const uniqueClients = useMemo(() =>
    [...new Set(history.map(e => e.cname).filter(Boolean))].sort()
  , [history])

  const filteredHistory = useMemo(() =>
    clientFilter ? history.filter(e => e.cname === clientFilter) : history
  , [history, clientFilter])

  return (
    <>
      <nav data-open={sidebarOpen} style={{
        width: 232, minWidth: 232,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px 16px 18px', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border)',
        }}>
          <KickstartLogo size={30} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Kickstart</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.02em', marginTop: 1 }}>Project artefact generator</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '10px 8px 0', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)', padding: '0 8px', marginBottom: 4, display: 'block' }}>
            Workspace
          </span>

          {/* Generate documents — action button */}
          <button
            onClick={onNewSession}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 12px', borderRadius: 9,
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: '#fff', background: 'var(--purple)',
              transition: 'all 0.12s', border: 'none', width: '100%',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New document generation
          </button>

          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="nav-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13,
                fontWeight: page === id ? 500 : 400,
                color: page === id ? 'var(--purple)' : 'var(--t2)',
                background: page === id ? 'var(--pl)' : 'transparent',
                transition: 'all 0.12s', border: 'none', width: '100%', textAlign: 'left',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Generated Projects */}
        {history.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ padding: '0 16px', flexShrink: 0, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={11} color="var(--t3)" />
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>
                Generated Projects
              </span>
              <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 'auto' }}>{history.length}</span>
            </div>

            {uniqueClients.length > 1 && (
              <div style={{ padding: '0 8px', marginBottom: 6, flexShrink: 0 }}>
                <select
                  value={clientFilter}
                  onChange={e => setClientFilter(e.target.value)}
                  style={{ width: '100%', fontSize: 11, padding: '5px 8px', border: '1px solid var(--border-mid)', borderRadius: 6, background: 'var(--bg)', color: 'var(--t2)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  <option value="">All clients</option>
                  {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
              {filteredHistory.map(entry => {
                const isActive = activeSessionId === entry.id
                const displayName = entry.pname || 'Untitled'
                return (
                  <div key={entry.id} style={{ position: 'relative', marginBottom: 2 }}>
                    <button
                      onClick={() => onLoadHistory?.(entry)}
                      className="history-btn"
                      style={{
                        width: '100%', textAlign: 'left',
                        background: isActive ? 'var(--pl)' : 'transparent',
                        border: 'none', borderRadius: 8, padding: '7px 28px 7px 10px',
                        cursor: 'pointer', transition: 'background 0.12s',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'var(--purple)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: entry.pname ? 'normal' : 'italic' }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[entry.cname, formatDate(entry.timestamp)].filter(Boolean).join(' · ')}
                      </div>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(entry) }}
                      title="Delete"
                      style={{
                        position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--t3)', padding: 4, borderRadius: 4,
                        display: 'flex', alignItems: 'center',
                        opacity: 0.6,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: history.length === 0 ? 'auto' : 0, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
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
            v{pkg.version} · {new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </div>
        </div>
      </nav>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px', maxWidth: 360, width: 'calc(100% - 32px)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Delete "{deleteTarget.pname || 'Untitled'}"?</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 20px', lineHeight: 1.6 }}>
              This will remove the project from your history. Any files you already downloaded won't be affected.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'var(--surface)', color: 'var(--t2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDeleteHistory?.(deleteTarget.id); setDeleteTarget(null) }}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
