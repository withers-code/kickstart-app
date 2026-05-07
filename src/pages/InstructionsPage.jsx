import React, { useState } from 'react'
import {
  ChevronDown, RotateCcw, Save, Upload, FileText, X, Check,
  Shield, Users, LayoutGrid, Calendar, Clipboard, Phone,
  CheckCircle, List, Repeat2, CheckSquare, Code, File, Send,
  BookOpen, Layers, Presentation, BarChart3,
  Activity, GitBranch, Monitor, Lightbulb, Archive,
  FolderOpen, DollarSign, Building2,
} from 'lucide-react'
import { PHASES, ALL_ARTS, DEFAULT_INSTRUCTIONS } from '../lib/constants.js'
import { Textarea, Btn, Spinner } from '../components/ui.jsx'
import { extractExampleText } from '../lib/sowParser.js'

const ICON_MAP = {
  'pid': FolderOpen, 'dod-dor': CheckCircle, 'requirements': List, 'meeting-notes': FileText,
  'handover': Repeat2, 'retrospective': Repeat2, 'project-checklist': CheckSquare,
  'tech-spec': Code, 'uat-guide': File, 'client-request': Send,
  'raid': Shield, 'stakeholder': Users, 'raci': LayoutGrid,
  'project-plan': Calendar, 'budget-tracker': DollarSign, 'decision-log': Clipboard, 'comms-plan': Phone,
  'confluence': BookOpen, 'jira-sow': Layers,
  'kick-off-deck': Presentation, 'steering-pack': Building2, 'delivery-report': BarChart3,
  'status-report': Activity, 'change-request': GitBranch,
  'sprint-review': Monitor, 'lessons-learned': Lightbulb, 'project-closure': Archive,
}

const artById = Object.fromEntries(ALL_ARTS.map(a => [a.id, a]))

function typeStyle(type) {
  if (type === 'prompt') return { label: 'prompt', color: 'var(--pd)', bg: 'var(--pm)', icon: 'var(--pd)' }
  if (type === 'xlsx')   return { label: '.xlsx',  color: 'var(--green)', bg: 'var(--gl)', icon: 'var(--green)' }
  if (type === 'pptx')   return { label: '.pptx',  color: 'var(--amber)', bg: 'var(--al)', icon: 'var(--amber)' }
  return                        { label: '.docx',  color: 'var(--purple)', bg: 'var(--pl)', icon: 'var(--purple)' }
}

function ArtefactRow({ art, instructions, examples, onSave, onReset, onUploadExample, onClearExample }) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const hasOverride = !!(instructions[art.id])
  const hasExample = !!(examples[art.id])
  const Icon = ICON_MAP[art.id] || FileText
  const ts = typeStyle(art.type)
  const currentDraft = draft !== null ? draft : (instructions[art.id] || '')

  function open() {
    setIsOpen(o => {
      if (!o && draft === null) setDraft(instructions[art.id] || '')
      return !o
    })
  }

  function handleSave() {
    onSave(art.id, currentDraft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleUpload(file) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const text = await extractExampleText(file)
      onUploadExample(art.id, text, file.name)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${isOpen ? 'var(--border-mid)' : 'var(--border)'}`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: isOpen ? 'var(--shm)' : 'none',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Row trigger */}
      <button
        onClick={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 11,
          padding: '11px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: ts.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={ts.icon} />
        </div>

        {/* Name + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {art.name}
          </div>
          <div className="art-desc" style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {art.desc}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: ts.color, background: ts.bg, padding: '2px 7px', borderRadius: 8 }}>
            {ts.label}
          </span>
          {hasOverride && (
            <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--pl)', color: 'var(--purple)', padding: '2px 7px', borderRadius: 8 }}>
              Custom
            </span>
          )}
          {hasExample && (
            <span style={{ fontSize: 10, fontWeight: 600, background: '#ECFDF5', color: '#065F46', padding: '2px 7px', borderRadius: 8 }}>
              Example
            </span>
          )}
          <ChevronDown size={14} color="var(--t3)" style={{ transition: 'transform 0.18s', transform: isOpen ? 'rotate(180deg)' : 'none', marginLeft: 2 }} />
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 14px 14px' }}>
          {/* Default behaviour */}
          <div style={{
            display: 'flex', gap: 8, background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 8,
            padding: '10px 12px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1, flexShrink: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: 1 }}>Default</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, flex: 1 }}>
              {DEFAULT_INSTRUCTIONS[art.id] || 'No description available.'}
            </div>
          </div>

          {/* Upload + Instructions — side by side on desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="responsive-form-grid">
            {/* Upload example */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Upload example
              </div>
              {hasExample ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#ECFDF5', border: '1px solid #6EE7B7',
                  borderRadius: 8, padding: '9px 12px', fontSize: 12, gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <FileText size={13} color="#065F46" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#065F46', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {examples[art.id].fileName}
                    </span>
                    <span style={{ color: '#6B7280', fontSize: 11, flexShrink: 0 }}>
                      {(examples[art.id].text.length / 1000).toFixed(1)}k chars
                    </span>
                  </div>
                  <button
                    onClick={() => onClearExample(art.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', borderRadius: 4, fontSize: 12, flexShrink: 0 }}
                  >
                    <X size={11} /> Clear
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '1.5px dashed var(--border-mid)', borderRadius: 8,
                  padding: '11px 13px', cursor: uploading ? 'default' : 'pointer',
                  background: 'var(--bg)', transition: 'border-color 0.12s',
                  flex: 1, boxSizing: 'border-box', minHeight: 56,
                }}>
                  {uploading ? <Spinner size={13} /> : <Upload size={13} color="var(--t3)" style={{ flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>
                      {uploading ? 'Extracting text…' : 'Upload a good example'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                      .docx, .xlsx or .txt
                    </div>
                  </div>
                  <input type="file" accept=".docx,.xlsx,.txt" style={{ display: 'none' }} disabled={uploading} onChange={e => handleUpload(e.target.files?.[0])} />
                </label>
              )}
              {uploadError && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>{uploadError}</div>}
            </div>

            {/* Custom instructions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Override instructions
              </div>
              <Textarea
                value={currentDraft}
                onChange={e => { setDraft(e.target.value); setSaved(false) }}
                rows={3}
                placeholder={`e.g. "Always include a cost impact column" or "Use RAG status for all risks"`}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: saved ? 'var(--green)' : 'var(--text)',
                color: '#fff', border: 'none', cursor: 'pointer',
                transition: 'background 0.2s', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save</>}
            </button>
            {hasOverride && (
              <button
                onClick={() => { onReset(art.id); setDraft('') }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'none', color: 'var(--t3)',
                  border: '1px solid var(--border-mid)', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <RotateCcw size={12} /> Reset to default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function InstructionsPage({ instructions, setInstructions, examples, setExamples }) {
  const [activePhase, setActivePhase] = useState('initiation')

  const phase = PHASES.find(p => p.id === activePhase)
  const phaseArts = (phase?.artIds || []).map(id => artById[id]).filter(Boolean)

  const totalCustom = Object.keys(instructions).length
  const totalExamples = Object.keys(examples).length

  function handleSave(id, value) {
    const updated = { ...instructions, [id]: value }
    if (!value) delete updated[id]
    setInstructions(updated)
  }

  function handleReset(id) {
    const updated = { ...instructions }
    delete updated[id]
    setInstructions(updated)
  }

  function handleUploadExample(id, text, fileName) {
    setExamples(ex => ({ ...ex, [id]: { text, fileName } }))
  }

  function handleClearExample(id) {
    setExamples(ex => { const u = { ...ex }; delete u[id]; return u })
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--rl2)', padding: '16px 20px', marginBottom: 20,
        boxShadow: 'var(--sh)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>
          Customise how each artefact is generated
        </div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, marginBottom: totalCustom + totalExamples > 0 ? 12 : 0 }}>
          Upload a real example to use as a quality reference, or add written instructions to override the default behaviour. Both are saved to this browser and applied on every generation.
        </div>
        {(totalCustom + totalExamples) > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {totalCustom > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--pl)', color: 'var(--purple)', padding: '3px 10px', borderRadius: 20 }}>
                {totalCustom} custom instruction{totalCustom !== 1 ? 's' : ''}
              </span>
            )}
            {totalExamples > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#065F46', padding: '3px 10px', borderRadius: 20 }}>
                {totalExamples} example{totalExamples !== 1 ? 's' : ''} uploaded
              </span>
            )}
          </div>
        )}
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {PHASES.map(ph => {
          const phArts = (ph.artIds || []).map(id => artById[id]).filter(Boolean)
          const customCount = phArts.filter(a => instructions[a.id] || examples[a.id]).length
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
              {customCount > 0 && (
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.75 }}>
                  {customCount} customised
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Artefact list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {phaseArts.map(art => (
          <ArtefactRow
            key={art.id}
            art={art}
            instructions={instructions}
            examples={examples}
            onSave={handleSave}
            onReset={handleReset}
            onUploadExample={handleUploadExample}
            onClearExample={handleClearExample}
          />
        ))}
      </div>

      <style>{`@media (max-width: 600px) { .art-desc { display: none; } }`}</style>
    </div>
  )
}
