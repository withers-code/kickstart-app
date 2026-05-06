import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { PHASES, ALL_ARTS } from '../lib/constants.js'
import { Divider } from './ui.jsx'
import {
  Shield, Users, LayoutGrid, Calendar, Clipboard, Phone,
  CheckCircle, List, FileText, Repeat2, CheckSquare, Code, File, Send,
  BookOpen, Layers, Presentation, BarChart3,
  Activity, GitBranch, Monitor, Lightbulb, Archive,
} from 'lucide-react'

const ICON_MAP = {
  'dod-dor': CheckCircle, 'requirements': List, 'meeting-notes': FileText,
  'handover': Repeat2, 'retrospective': Repeat2, 'project-checklist': CheckSquare,
  'tech-spec': Code, 'uat-guide': File, 'client-request': Send,
  'raid': Shield, 'stakeholder': Users, 'raci': LayoutGrid,
  'project-plan': Calendar, 'decision-log': Clipboard, 'comms-plan': Phone,
  'confluence': BookOpen, 'jira-sow': Layers,
  'kick-off-deck': Presentation, 'delivery-report': BarChart3,
  'status-report': Activity, 'change-request': GitBranch,
  'sprint-review': Monitor, 'lessons-learned': Lightbulb, 'project-closure': Archive,
}

const artById = Object.fromEntries(ALL_ARTS.map(a => [a.id, a]))

function typeBadge(art) {
  const isPrompt = art.type === 'prompt'
  if (isPrompt) return { label: 'prompt', color: 'var(--pd)', bg: 'var(--pm)' }
  if (art.type === 'xlsx') return { label: '.xlsx', color: 'var(--green)', bg: 'var(--gl)' }
  if (art.type === 'pptx') return { label: '.pptx', color: 'var(--amber)', bg: 'var(--al)' }
  return { label: '.docx', color: 'var(--purple)', bg: 'var(--pl)' }
}

function ArtCard({ art, selected, onToggle }) {
  const Icon = ICON_MAP[art.id] || FileText
  const isPrompt = art.type === 'prompt'
  const activeColor = isPrompt ? 'var(--amber)' : 'var(--purple)'
  const activeBg = isPrompt ? '#FEF3C740' : 'var(--pl)'
  const activeBorder = isPrompt ? 'var(--amber)' : 'var(--purple)'
  const badge = typeBadge(art)

  return (
    <div
      onClick={() => onToggle(art.id)}
      style={{
        border: `1px solid ${selected ? activeBorder : isPrompt ? '#FCD34D80' : 'var(--border)'}`,
        borderRadius: 10, padding: '11px 13px', cursor: 'pointer',
        transition: 'all 0.12s', userSelect: 'none',
        background: selected ? activeBg : isPrompt ? '#FFFBF0' : 'var(--surface)',
        boxShadow: selected ? `0 0 0 1px ${activeBorder}` : undefined,
        position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
    >
      <div style={{
        width: 26, height: 26,
        background: selected ? (isPrompt ? 'rgba(217,119,6,0.2)' : 'var(--pm)') : 'var(--bg)',
        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
      }}>
        <Icon size={13} color={selected ? activeColor : 'var(--t2)'} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 2, color: selected ? (isPrompt ? '#92400E' : 'var(--pd)') : 'var(--text)' }}>
        {art.name}
      </div>
      <div style={{ fontSize: 10.5, color: selected ? activeColor : 'var(--t3)', lineHeight: 1.4 }}>
        {art.desc}
      </div>
      <div style={{ marginTop: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg, padding: '1px 6px', borderRadius: 8 }}>
          {badge.label}
        </span>
      </div>
      {isPrompt && !selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
          background: 'var(--amber)', color: '#fff', padding: '1px 5px',
          borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Atlassian</div>
      )}
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8, width: 16, height: 16,
          borderRadius: '50%', background: isPrompt ? 'var(--amber)' : 'var(--purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={9} color="white" strokeWidth={3} />
        </div>
      )}
    </div>
  )
}

export default function ArtefactGrid({ selected, onToggle, onToggleAll, onBulkToggle }) {
  const [activePhase, setActivePhase] = useState('initiation')

  const phase = PHASES.find(p => p.id === activePhase)
  const phaseArts = (phase?.artIds || []).map(id => artById[id]).filter(Boolean)
  const phaseSelectedCount = phaseArts.filter(a => selected.has(a.id)).length
  const phaseAllSelected = phaseSelectedCount === phaseArts.length && phaseArts.length > 0

  function handlePhaseToggle() {
    const ids = phaseArts.map(a => a.id)
    onBulkToggle(ids, !phaseAllSelected)
  }

  return (
    <div>
      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {PHASES.map(ph => {
          const phArts = (ph.artIds || []).map(id => artById[id]).filter(Boolean)
          const selCount = phArts.filter(a => selected.has(a.id)).length
          const isActive = activePhase === ph.id
          return (
            <button
              key={ph.id}
              onClick={() => setActivePhase(ph.id)}
              style={{
                flex: 1, padding: '9px 8px', borderRadius: 9,
                border: `1.5px solid ${isActive ? 'var(--text)' : 'var(--border-mid)'}`,
                background: isActive ? 'var(--text)' : 'var(--surface)',
                color: isActive ? 'var(--surface)' : 'var(--t2)',
                cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.12s', lineHeight: 1.3,
              }}
            >
              <div>{ph.label}</div>
              {selCount > 0 && (
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.75 }}>
                  {selCount} selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Phase subtitle + controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{phase?.desc}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>{selected.size} total</span>
          <button onClick={handlePhaseToggle} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--purple)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, whiteSpace: 'nowrap' }}>
            {phaseAllSelected ? 'Deselect phase' : 'Select phase'}
          </button>
          <button onClick={onToggleAll} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--t3)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, whiteSpace: 'nowrap' }}>
            {selected.size === ALL_ARTS.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      {/* Artefact grid */}
      <div className="art-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 7 }}>
        {phaseArts.map(art => (
          <ArtCard key={art.id} art={art} selected={selected.has(art.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}
