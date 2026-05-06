import React, { useState } from 'react'
import { Download, Copy, ChevronUp, ChevronDown, Check, Zap, RotateCcw } from 'lucide-react'
import { Spinner } from './ui.jsx'

function saveBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadResult(result, projectSlug) {
  const { id, type, data } = result
  if (type === 'docx') saveBlob(data, `${projectSlug}-${id}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  else if (type === 'xlsx') saveBlob(data, `${projectSlug}-${id}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  else if (type === 'pptx') saveBlob(data, `${projectSlug}-${id}.pptx`, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
  else if (type === 'prompt') saveBlob(data, `${projectSlug}-${id}.txt`, 'text/plain')
}

function StatusIcon({ status }) {
  if (status === 'working') return <Spinner size={11} />
  if (status === 'done') return <Check size={11} color="#065F46" strokeWidth={3} />
  if (status === 'prompt') return <Zap size={11} color="var(--purple)" />
  return <RotateCcw size={11} color="var(--red)" />
}

function chipStyle(status) {
  if (status === 'done') return { background: '#ECFDF5', border: '1px solid #6EE7B7' }
  if (status === 'prompt') return { background: 'var(--pl)', border: '1px solid var(--pm)' }
  if (status === 'error') return { background: 'var(--rl)', border: '1px solid #FCA5A5' }
  return { background: 'var(--surface2)', border: '1px solid var(--border)' }
}

function chipTextColor(status) {
  if (status === 'done') return '#065F46'
  if (status === 'prompt') return 'var(--pd)'
  if (status === 'error') return 'var(--red)'
  return 'var(--t2)'
}

export default function GenerationBanner({ results, generating, projectSlug, onRegenerateOne }) {
  const [collapsed, setCollapsed] = useState(false)

  if (results.length === 0) return null

  const doneCount = results.filter(r => r.status === 'done' || r.status === 'prompt').length
  const errorCount = results.filter(r => r.status === 'error').length
  const workingCount = results.filter(r => r.status === 'working').length

  const statusLine = generating
    ? `Generating… ${doneCount + errorCount} of ${results.length} complete`
    : `${doneCount} artefact${doneCount !== 1 ? 's' : ''} ready${errorCount > 0 ? ` · ${errorCount} failed` : ''}`

  function retryFailed() {
    results.filter(r => r.status === 'error').forEach(r => onRegenerateOne?.(r.id))
  }

  return (
    <>
      {!collapsed && <div style={{ height: 150 }} />}

      <div className="gen-banner" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        zIndex: 200,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 20px',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
        }}>
          {workingCount > 0 ? <Spinner size={13} /> : <Check size={13} color="var(--green)" strokeWidth={2.5} />}
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: 'var(--text)' }}>
            {statusLine}
          </span>
          {errorCount > 0 && !generating && (
            <button
              onClick={retryFailed}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: 'var(--rl)', color: 'var(--red)',
                border: '1px solid #FCA5A5', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <RotateCcw size={11} /> Retry failed
            </button>
          )}
          <button
            title={collapsed ? 'Show artefacts' : 'Collapse'}
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: 6 }}
          >
            {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Chips */}
        {!collapsed && (
          <div style={{
            padding: '10px 20px 12px',
            display: 'flex', flexWrap: 'wrap', gap: 7,
            maxHeight: 112, overflowY: 'auto',
          }}>
            {results.map(r => (
              <div
                key={r.id}
                title={r.status === 'error' ? r.error : undefined}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 9px', borderRadius: 8, fontSize: 12,
                  ...chipStyle(r.status),
                }}
              >
                <StatusIcon status={r.status} />
                <span style={{ color: chipTextColor(r.status), fontWeight: 500 }}>{r.name}</span>
                {(r.status === 'done' || r.status === 'prompt') && (
                  <button
                    title={`Download ${r.name}`}
                    onClick={() => downloadResult(r, projectSlug)}
                    className="chip-action"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: chipTextColor(r.status), display: 'flex', padding: 0, marginLeft: 2 }}
                  >
                    <Download size={11} />
                  </button>
                )}
                {r.status === 'prompt' && (
                  <button
                    title="Copy Rovo prompt"
                    onClick={() => typeof r.data === 'string' && navigator.clipboard.writeText(r.data)}
                    className="chip-action"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: chipTextColor(r.status), display: 'flex', padding: 0 }}
                  >
                    <Copy size={11} />
                  </button>
                )}
                {(r.status === 'done' || r.status === 'prompt' || r.status === 'error') && (
                  <button
                    title="Regenerate"
                    onClick={() => onRegenerateOne?.(r.id)}
                    className="chip-action"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: chipTextColor(r.status), display: 'flex', padding: 0, opacity: r.status === 'error' ? 1 : 0.5 }}
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
