import React, { useState } from 'react'
import { signIn } from '../lib/auth.js'

function KickstartLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="7" fill="#0F172A"/>
      <path d="M9 7v16M9 15l10-8M9 15l10 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 5.5L23.78 7.22L25.5 8L23.78 8.78L23 10.5L22.22 8.78L20.5 8L22.22 7.22Z" fill="#F59E0B"/>
    </svg>
  )
}

function MsLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  )
}

export default function LoginScreen({ onSignIn }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signIn()
      // Page redirects to Microsoft — execution stops here on success
    } catch (e) {
      setError(e.message || 'Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
        padding: 'clamp(32px, 6vw, 48px)', textAlign: 'center',
        maxWidth: 380, width: 'calc(100% - 32px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <KickstartLogo size={52} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Kickstart</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 28, marginTop: 0 }}>Project artefact generator</p>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--rl)', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'left' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '12px 20px',
            background: loading ? '#555' : '#0078D4',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.12s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <MsLogo />
          {loading ? 'Signing in…' : 'Sign in with Microsoft'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 20, marginBottom: 0, lineHeight: 1.6 }}>
          Sign in with your organisation's Microsoft account.<br />
          Your API key and settings are stored in your browser only.
        </p>
      </div>
    </div>
  )
}
