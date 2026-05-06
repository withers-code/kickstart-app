import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardTitle, Btn } from './ui.jsx'

export default function InstructionsEditor({ selected, instructions, onSave }) {
  const [localInstructions, setLocalInstructions] = useState(instructions)
  const [expanded, setExpanded] = useState(false)

  if (selected.size === 0) return null

  const selectedArts = Array.from(selected)

  const handleSave = () => {
    onSave(localInstructions)
  }

  const handleChange = (artId, value) => {
    setLocalInstructions(prev => ({
      ...prev,
      [artId]: value
    }))
  }

  return (
    <Card style={{ marginBottom: 14, marginTop: 14, background: 'var(--surface2)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          padding: '0 0 10px 0',
          marginBottom: 10,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <CardTitle style={{ margin: 0 }}>✏️ Custom instructions</CardTitle>
        </div>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{selectedArts.length} artefact{selectedArts.length !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
            {selectedArts.map(artId => (
              <div key={artId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', letterSpacing: '0.02em' }}>
                  {artId}
                </label>
                <textarea
                  value={localInstructions[artId] || ''}
                  onChange={(e) => handleChange(artId, e.target.value)}
                  placeholder="e.g., 'Focus on risks in red/amber status' or 'Use RAG format'"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--border-mid)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: 'var(--text)',
                    outline: 'none',
                    minHeight: 50,
                    resize: 'vertical',
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--purple)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-mid)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={handleSave} style={{ padding: '8px 15px', fontSize: 12 }}>
              Save instructions
            </Btn>
            <Btn variant="ghost" onClick={() => setExpanded(false)} style={{ padding: '8px 15px', fontSize: 12 }}>
              Cancel
            </Btn>
          </div>
        </>
      )}
    </Card>
  )
}
