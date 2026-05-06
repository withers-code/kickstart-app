import React from 'react'
import { Plus } from 'lucide-react'

export default function WelcomePage({ onNewSession }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '58vh', textAlign: 'center',
      gap: 22, padding: '40px 20px',
    }}>
      <svg width="54" height="54" viewBox="0 0 30 30" fill="none" style={{ flexShrink: 0 }}>
        <rect width="30" height="30" rx="7" fill="#0F172A"/>
        <path d="M9 7v16M9 15l10-8M9 15l10 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 5.5L23.78 7.22L25.5 8L23.78 8.78L23 10.5L22.22 8.78L20.5 8L22.22 7.22Z" fill="#F59E0B" />
      </svg>

      <div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 10, color: 'var(--text)' }}>
          Welcome to Kickstart
        </div>
        <div style={{ fontSize: 14, color: 'var(--t2)', maxWidth: 420, lineHeight: 1.7, margin: '0 auto' }}>
          Generate professional project artefacts tailored to your engagement — kick-off decks, RAID logs, requirements docs, and more.
        </div>
      </div>

      <button
        onClick={onNewSession}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 22px', borderRadius: 10,
          background: 'var(--purple)', color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          marginTop: 4,
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        New document generation
      </button>

      <div style={{ fontSize: 12, color: 'var(--t3)' }}>
        Or select a previous project from the sidebar
      </div>
    </div>
  )
}
