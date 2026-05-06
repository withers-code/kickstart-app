import React from 'react'
import { Check } from 'lucide-react'
import { DOCX_ARTS, XLSX_ARTS, PPT_ARTS, EXT_ARTS } from '../lib/constants.js'
import { Divider } from './ui.jsx'
import {
  Shield, Users, LayoutGrid, Calendar, Clipboard, Phone,
  CheckCircle, List, FileText, Repeat2, CheckSquare, Code, File, Send,
  BookOpen, Layers, Presentation, BarChart3,
} from 'lucide-react'

const ICON_MAP = {
  'dod-dor': CheckCircle, 'requirements': List, 'meeting-notes': FileText,
  'handover': Repeat2, 'retrospective': Repeat2, 'project-checklist': CheckSquare,
  'tech-spec': Code, 'uat-guide': File, 'client-request': Send,
  'raid': Shield, 'stakeholder': Users, 'raci': LayoutGrid,
  'project-plan': Calendar, 'decision-log': Clipboard, 'comms-plan': Phone,
  'confluence': BookOpen, 'jira-sow': Layers,
  'kick-off-deck': Presentation, 'delivery-report': BarChart3,
}

function ArtCard({ art, selected, isExt, onToggle }) {
  const Icon = ICON_MAP[art.id] || FileText
  return (
    <div
      onClick={() => onToggle(art.id)}
      style={{
        border: `1px solid ${selected ? (isExt ? 'var(--amber)' : 'var(--purple)') : isExt ? '#FCD34D80' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '11px 13px',
        cursor: 'pointer',
        transition: 'all 0.12s',
        background: selected ? (isExt ? '#FEF3C740' : 'var(--pl)') : isExt ? '#FFFBF0' : 'var(--surface)',
        position: 'relative',
        userSelect: 'none',
        boxShadow: selected ? `0 0 0 1px ${isExt ? 'var(--amber)' : 'var(--purple)'}` : undefined,
        transform: !selected ? undefined : 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
    >
      <div style={{
        width: 26, height: 26, background: selected ? (isExt ? 'rgba(217,119,6,0.2)' : 'var(--pm)') : 'var(--bg)',
        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
      }}>
        <Icon size={13} color={selected ? (isExt ? 'var(--amber)' : 'var(--purple)') : 'var(--t2)'} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 2, color: selected ? (isExt ? '#92400E' : 'var(--pd)') : 'var(--text)' }}>
        {art.name}
      </div>
      <div style={{ fontSize: 10.5, color: selected ? (isExt ? 'var(--amber)' : 'var(--purple)') : 'var(--t3)', lineHeight: 1.4 }}>
        {art.desc}
      </div>
      <div style={{ marginTop: 5 }}>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: isExt ? 'var(--pd)' : art.type === 'xlsx' ? 'var(--green)' : 'var(--purple)',
          background: isExt ? 'var(--pm)' : art.type === 'xlsx' ? 'var(--gl)' : 'var(--pl)',
          padding: '1px 6px', borderRadius: 8,
        }}>
          {isExt ? 'prompt' : `.${art.type}`}
        </span>
      </div>
      {isExt && !selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 9, fontWeight: 700, background: 'var(--amber)', color: '#fff',
          padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Atlassian
        </div>
      )}
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 16, height: 16, borderRadius: '50%',
          background: isExt ? 'var(--amber)' : 'var(--purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={9} color="white" strokeWidth={3} />
        </div>
      )}
    </div>
  )
}

export default function ArtefactGrid({ selected, onToggle, onToggleAll }) {
  const allCount = DOCX_ARTS.length + XLSX_ARTS.length + PPT_ARTS.length + EXT_ARTS.length
  const allSelected = selected.size === allCount

  return (
    <div>
      <Divider label="Word documents (.docx)" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{selected.size} selected</span>
        <button
          onClick={onToggleAll}
          style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--purple)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 7, marginBottom: 4 }}>
        {DOCX_ARTS.map(art => <ArtCard key={art.id} art={art} selected={selected.has(art.id)} isExt={false} onToggle={onToggle} />)}
      </div>

      <Divider label="Spreadsheets (.xlsx)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 7, marginBottom: 4 }}>
        {XLSX_ARTS.map(art => <ArtCard key={art.id} art={art} selected={selected.has(art.id)} isExt={false} onToggle={onToggle} />)}
      </div>

      <Divider label="Presentations (.pptx)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 7, marginBottom: 4 }}>
        {PPT_ARTS.map(art => <ArtCard key={art.id} art={art} selected={selected.has(art.id)} isExt={false} onToggle={onToggle} />)}
      </div>

      <Divider label="Atlassian — Rovo prompts" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 7, marginBottom: 8 }}>
        {EXT_ARTS.map(art => <ArtCard key={art.id} art={art} selected={selected.has(art.id)} isExt={true} onToggle={onToggle} />)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        These produce a structured prompt — copy into Atlassian Rovo or paste directly into Confluence / Jira
      </div>
    </div>
  )
}
