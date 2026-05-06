import React, { useRef, useState } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { Spinner } from './ui.jsx'
import { parseSoW } from '../lib/sowParser.js'

export default function SowUploader({ opts, onPopulate, onClear, populated, fileName }) {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file) return
    if (!opts.apiKey) { setError('Add your API key in Settings before uploading a SoW.'); return }
    setError(null)
    setParsing(true)
    try {
      const fields = await parseSoW(file, opts)
      onPopulate(fields, file.name)
    } catch (e) {
      setError(e.message)
    } finally {
      setParsing(false)
    }
  }

  function onInputChange(e) { handleFile(e.target.files?.[0]) }

  function onDrop(e) {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  // ── Populated state ──────────────────────────────────────────────────────────
  if (populated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--gl)', border: '1px solid #6EE7B7', borderRadius: 8,
        padding: '10px 14px', marginBottom: 14, gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={14} color="var(--green)" />
          <span style={{ fontSize: 12, color: '#065F46', fontWeight: 500 }}>
            Fields pre-populated from <strong>{fileName}</strong> — review and edit below
          </span>
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 6px', borderRadius: 4 }}>
          <X size={12} /> Clear
        </button>
      </div>
    )
  }

  // ── Upload zone ──────────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        onClick={() => !parsing && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--purple)' : 'var(--border-mid)'}`,
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: parsing ? 'default' : 'pointer',
          background: dragging ? 'var(--pl)' : 'var(--bg)',
          transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {parsing ? <Spinner size={14} /> : <Upload size={14} color="var(--t2)" />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: parsing ? 'var(--t3)' : 'var(--text)' }}>
            {parsing ? 'Reading your SoW…' : 'Upload Statement of Work'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
            {parsing ? 'Claude is extracting project details' : 'Optional · .pdf, .docx or .txt · auto-fills the fields below'}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '8px 12px', background: 'var(--rl)', border: '1px solid #FCA5A5', borderRadius: 7, fontSize: 12, color: 'var(--red)' }}>
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={onInputChange} />
    </div>
  )
}
