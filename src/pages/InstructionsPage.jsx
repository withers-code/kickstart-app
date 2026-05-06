import React, { useState } from 'react'
import { ChevronDown, RotateCcw, Save } from 'lucide-react'
import { DOCX_ARTS, XLSX_ARTS, PPT_ARTS, EXT_ARTS, DEFAULT_INSTRUCTIONS } from '../lib/constants.js'
import { Textarea, Btn } from '../components/ui.jsx'

const GROUPS = [
  { label: 'Word documents (.docx)', arts: DOCX_ARTS },
  { label: 'Excel spreadsheets (.xlsx)', arts: XLSX_ARTS },
  { label: 'Presentations (.pptx)', arts: PPT_ARTS },
  { label: 'Atlassian prompts', arts: EXT_ARTS },
]

export default function InstructionsPage({ instructions, setInstructions }) {
  const [openId, setOpenId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [saved, setSaved] = useState({})

  function toggleOpen(id) {
    if (openId === id) {
      setOpenId(null)
    } else {
      setOpenId(id)
      if (!(id in drafts)) setDrafts(d => ({ ...d, [id]: instructions[id] || '' }))
    }
  }

  function handleDraftChange(id, value) {
    setDrafts(d => ({ ...d, [id]: value }))
    setSaved(s => ({ ...s, [id]: false }))
  }

  function handleSave(id) {
    const updated = { ...instructions, [id]: drafts[id] || '' }
    if (!drafts[id]) delete updated[id]
    setInstructions(updated)
    setSaved(s => ({ ...s, [id]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000)
  }

  function handleReset(id) {
    setDrafts(d => ({ ...d, [id]: '' }))
    const updated = { ...instructions }
    delete updated[id]
    setInstructions(updated)
    setSaved(s => ({ ...s, [id]: false }))
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, marginTop: 0, lineHeight: 1.6 }}>
        Customise how each artefact is generated. Overrides are saved to this browser and applied every time you generate. Leave blank to use the default behaviour.
      </p>

      {GROUPS.map(({ label, arts }) => (
        <div key={label} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--t3)', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {arts.map(art => {
              const isOpen = openId === art.id
              const hasOverride = !!(instructions[art.id])

              return (
                <div key={art.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => toggleOpen(art.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <ChevronDown size={14} color="var(--t3)" style={{
                      transition: 'transform 0.18s',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{art.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)', marginRight: 4 }} className="art-desc">{art.desc}</span>
                    {hasOverride && (
                      <span style={{
                        fontSize: 10, background: 'var(--pl)', color: 'var(--purple)',
                        padding: '2px 8px', borderRadius: 10, fontWeight: 600, flexShrink: 0,
                      }}>
                        Custom
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ marginTop: 14, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Default behaviour
                        </div>
                        <div style={{
                          fontSize: 12, color: 'var(--t2)', background: 'var(--bg)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          padding: '10px 12px', lineHeight: 1.6,
                        }}>
                          {DEFAULT_INSTRUCTIONS[art.id] || 'No default description available.'}
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Your override
                        </div>
                        <Textarea
                          value={drafts[art.id] !== undefined ? drafts[art.id] : (instructions[art.id] || '')}
                          onChange={e => handleDraftChange(art.id, e.target.value)}
                          rows={3}
                          placeholder={`e.g. "Include a cost impact column in the log" or "Use RAG status for all risks"`}
                          style={{ fontSize: 12 }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Btn variant="primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => handleSave(art.id)}>
                          <Save size={12} />
                          {saved[art.id] ? 'Saved!' : 'Save'}
                        </Btn>
                        {hasOverride && (
                          <Btn variant="ghost" style={{ fontSize: 12, padding: '7px 14px', color: 'var(--t3)' }} onClick={() => handleReset(art.id)}>
                            <RotateCcw size={12} />
                            Reset to default
                          </Btn>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <style>{`
        @media (max-width: 600px) { .art-desc { display: none; } }
      `}</style>
    </div>
  )
}
