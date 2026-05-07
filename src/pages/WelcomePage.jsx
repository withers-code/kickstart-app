import React from 'react'
import { Plus, FileText, LayoutGrid, Presentation } from 'lucide-react'

const VALUE_PROPS = [
  { Icon: FileText,     label: 'Word documents',  desc: 'PID, RAID log, requirements, UAT guide, handover packs and more' },
  { Icon: LayoutGrid,   label: 'Spreadsheets',    desc: 'Budget tracker, project plan, RACI, stakeholder map and decision log' },
  { Icon: Presentation, label: 'Presentations',   desc: 'Kick-off deck, status report and steering committee pack' },
]

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
          marginTop: 4, transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--pd)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--purple)'}
      >
        <Plus size={16} strokeWidth={2.5} />
        New generation
      </button>

      {/* Value prop row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, maxWidth: 560, width: '100%', marginTop: 8,
      }}
        className="welcome-props"
      >
        {VALUE_PROPS.map(({ Icon, label, desc }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 14px 12px', textAlign: 'left',
            boxShadow: 'var(--sh)',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--pl)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Icon size={14} color="var(--purple)" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--t3)' }}>
        Or select a previous project from the sidebar
      </div>

      <style>{`@media (max-width: 520px) { .welcome-props { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
