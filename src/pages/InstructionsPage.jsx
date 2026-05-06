import React, { useState } from 'react'
import { ChevronDown, RotateCcw, Save, Upload, FileText, X } from 'lucide-react'
import { DOCX_ARTS, XLSX_ARTS, PPT_ARTS, EXT_ARTS, DEFAULT_INSTRUCTIONS } from '../lib/constants.js'
import { Textarea, Btn, Spinner } from '../components/ui.jsx'
import { extractExampleText } from '../lib/sowParser.js'

const GROUPS = [
  { label: 'Word documents (.docx)', arts: DOCX_ARTS },
  { label: 'Excel spreadsheets (.xlsx)', arts: XLSX_ARTS },
  { label: 'Presentations (.pptx)', arts: PPT_ARTS },
  { label: 'Atlassian prompts', arts: EXT_ARTS },
]

export default function InstructionsPage({ instructions, setInstructions, examples, setExamples }) {
  const [openId, setOpenId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [saved, setSaved] = useState({})
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadErrors, setUploadErrors] = useState({})

  function toggleOpen(id) {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    if (!(id in drafts)) setDrafts(d => ({ ...d, [id]: instructions[id] || '' }))
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
  }

  async function handleExampleUpload(id, file) {
    if (!file) return
    setUploadErrors(e => ({ ...e, [id]: null }))
    setUploadingId(id)
    try {
      const text = await extractExampleText(file)
      setExamples(ex => ({ ...ex, [id]: { text, fileName: file.name } }))
    } catch (err) {
      setUploadErrors(e => ({ ...e, [id]: err.message }))
    } finally {
      setUploadingId(null)
    }
  }

  function handleClearExample(id) {
    setExamples(ex => { const u = { ...ex }; delete u[id]; return u })
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, marginTop: 0, lineHeight: 1.6 }}>
        Customise how each artefact is generated. Upload a real example to use as a quality reference, or add written instructions to override the default behaviour. Both are saved to this browser and applied every time you generate.
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
              const hasExample = !!(examples[art.id])

              return (
                <div key={art.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleOpen(art.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <ChevronDown size={14} color="var(--t3)" style={{ transition: 'transform 0.18s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{art.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)', marginRight: 4 }} className="art-desc">{art.desc}</span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {hasOverride && <span style={{ fontSize: 10, background: 'var(--pl)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Custom</span>}
                      {hasExample && <span style={{ fontSize: 10, background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Example</span>}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border)' }}>

                      {/* Default behaviour */}
                      <div style={{ marginTop: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default behaviour</div>
                        <div style={{ fontSize: 12, color: 'var(--t2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
                          {DEFAULT_INSTRUCTIONS[art.id] || 'No description available.'}
                        </div>
                      </div>

                      {/* Example upload */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload example</div>
                        {hasExample ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '9px 12px', fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <FileText size={13} color="#065F46" />
                              <span style={{ color: '#065F46', fontWeight: 500 }}>{examples[art.id].fileName}</span>
                              <span style={{ color: '#6B7280', fontSize: 11 }}>{(examples[art.id].text.length / 1000).toFixed(1)}k chars</span>
                            </div>
                            <button onClick={() => handleClearExample(art.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                              <X size={11} /> Clear
                            </button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px dashed var(--border-mid)', borderRadius: 8, padding: '10px 14px', cursor: uploadingId === art.id ? 'default' : 'pointer', background: 'var(--bg)', transition: 'border-color 0.12s' }}>
                            {uploadingId === art.id ? <Spinner size={12} /> : <Upload size={12} color="var(--t3)" />}
                            <div>
                              <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{uploadingId === art.id ? 'Extracting text…' : 'Upload a good example'}</div>
                              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>.docx, .xlsx or .txt — used as a quality reference when generating</div>
                            </div>
                            <input type="file" accept=".docx,.xlsx,.txt" style={{ display: 'none' }} disabled={uploadingId !== null} onChange={e => handleExampleUpload(art.id, e.target.files?.[0])} />
                          </label>
                        )}
                        {uploadErrors[art.id] && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>{uploadErrors[art.id]}</div>}
                      </div>

                      {/* Custom instructions */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom instructions</div>
                        <Textarea
                          value={drafts[art.id] !== undefined ? drafts[art.id] : (instructions[art.id] || '')}
                          onChange={e => handleDraftChange(art.id, e.target.value)}
                          rows={3}
                          placeholder={`e.g. "Include a cost impact column" or "Use RAG status for all risks"`}
                          style={{ fontSize: 12 }}
                        />
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Btn variant="primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => handleSave(art.id)}>
                          <Save size={12} />{saved[art.id] ? 'Saved!' : 'Save'}
                        </Btn>
                        {hasOverride && (
                          <Btn variant="ghost" style={{ fontSize: 12, padding: '7px 14px', color: 'var(--t3)' }} onClick={() => handleReset(art.id)}>
                            <RotateCcw size={12} />Reset to default
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

      <style>{`@media (max-width: 600px) { .art-desc { display: none; } }`}</style>
    </div>
  )
}
