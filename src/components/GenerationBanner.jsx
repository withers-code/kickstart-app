import React, { useState } from 'react'
import { Download, Copy, ChevronUp, ChevronDown, Check, Zap, RotateCcw, Archive, Pencil, CornerDownRight } from 'lucide-react'
import { Spinner } from './ui.jsx'
import JSZip from 'jszip'

function mimeFor(type) {
  if (type === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (type === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (type === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  return 'text/plain'
}

function extFor(type) {
  if (type === 'docx') return 'docx'
  if (type === 'xlsx') return 'xlsx'
  if (type === 'pptx') return 'pptx'
  return 'txt'
}

function saveBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadResult(result, projectSlug) {
  const { id, type, data } = result
  saveBlob(data, `${projectSlug}-${id}.${extFor(type)}`, mimeFor(type))
}

async function downloadAllAsZip(results, projectSlug) {
  const zip = new JSZip()
  for (const r of results) {
    if (r.status !== 'done' && r.status !== 'prompt') continue
    const ext = extFor(r.type)
    const filename = `${projectSlug}-${r.id}.${ext}`
    if (r.type === 'prompt') {
      zip.file(filename, String(r.data || ''))
    } else {
      zip.file(filename, r.data)
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  saveBlob(blob, `${projectSlug}-artefacts.zip`, 'application/zip')
}

function StatusIcon({ status }) {
  if (status === 'working') return <Spinner size={11} />
  if (status === 'done') return <Check size={11} color="#065F46" strokeWidth={3} />
  if (status === 'prompt') return <Zap size={11} color="var(--purple)" />
  return <RotateCcw size={11} color="var(--red)" />
}

function chipStyle(status) {
  if (status === 'done')    return { background: '#ECFDF5', border: '1px solid #6EE7B7' }
  if (status === 'prompt')  return { background: 'var(--pl)', border: '1px solid var(--pm)' }
  if (status === 'error')   return { background: 'var(--rl)', border: '1px solid #FCA5A5' }
  return { background: 'var(--surface2)', border: '1px solid var(--border)' }
}
function chipTextColor(status) {
  if (status === 'done')   return '#065F46'
  if (status === 'prompt') return 'var(--pd)'
  if (status === 'error')  return 'var(--red)'
  return 'var(--t2)'
}

export default function GenerationBanner({ results, generating, projectSlug, onRegenerateOne, amendments = {}, onAmendmentChange }) {
  const [collapsed, setCollapsed] = useState(false)
  const [refineTarget, setRefineTarget] = useState(null)

  if (results.length === 0) return null

  const doneCount  = results.filter(r => r.status === 'done' || r.status === 'prompt').length
  const errorCount = results.filter(r => r.status === 'error').length
  const workingCount = results.filter(r => r.status === 'working').length

  const statusLine = generating
    ? `Generating… ${doneCount + errorCount} of ${results.length} complete`
    : `${doneCount} artefact${doneCount !== 1 ? 's' : ''} ready${errorCount > 0 ? ` · ${errorCount} failed` : ''}`

  function retryFailed() {
    results.filter(r => r.status === 'error').forEach(r => onRegenerateOne?.(r.id))
  }

  function handleRefineSubmit(artId) {
    const text = (amendments[artId] || '').trim()
    if (!text) return
    onRegenerateOne?.(artId, text)
    setRefineTarget(null)
  }

  return (
    <>
      {!collapsed && <div style={{ height: refineTarget ? 220 : 160 }} />}

      <div className="gen-banner" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', zIndex: 200,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: collapsed ? 'none' : '1px solid var(--border)' }}>
          {workingCount > 0 ? <Spinner size={13} /> : <Check size={13} color="var(--green)" strokeWidth={2.5} />}
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: 'var(--text)' }}>{statusLine}</span>

          {errorCount > 0 && !generating && (
            <button onClick={retryFailed} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: 'var(--rl)', color: 'var(--red)', border: '1px solid #FCA5A5',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              <RotateCcw size={11} /> Retry failed
            </button>
          )}

          {doneCount > 1 && !generating && (
            <button onClick={() => downloadAllAsZip(results, projectSlug)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: 'var(--pl)', color: 'var(--purple)', border: '1px solid var(--pm)',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              <Archive size={11} /> Download all
            </button>
          )}

          <button title={collapsed ? 'Show artefacts' : 'Collapse'} onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: 8, borderRadius: 6 }}>
            {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Chips */}
        {!collapsed && (
          <div style={{ padding: '10px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 112, overflowY: 'auto' }}>
            {results.map(r => (
              <div key={r.id} title={r.status === 'error' ? r.error : undefined}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, fontSize: 12, ...chipStyle(r.status) }}>
                <StatusIcon status={r.status} />
                <span style={{ color: chipTextColor(r.status), fontWeight: 500 }}>{r.name}</span>
                {(r.status === 'done' || r.status === 'prompt') && (
                  <button title={`Download ${r.name}`} onClick={() => downloadResult(r, projectSlug)}
                    className="chip-action" style={{ background: 'none', border: 'none', cursor: 'pointer', color: chipTextColor(r.status), display: 'flex', padding: 0, marginLeft: 2 }}>
                    <Download size={11} />
                  </button>
                )}
                {r.status === 'prompt' && (
                  <button title="Copy Rovo prompt" onClick={() => typeof r.data === 'string' && navigator.clipboard.writeText(r.data)}
                    className="chip-action" style={{ background: 'none', border: 'none', cursor: 'pointer', color: chipTextColor(r.status), display: 'flex', padding: 0 }}>
                    <Copy size={11} />
                  </button>
                )}
                {(r.status === 'done' || r.status === 'prompt' || r.status === 'error') && (
                  <button title="Regenerate" onClick={() => onRegenerateOne?.(r.id)}
                    className="chip-action" style={{ background: 'none', border: 'none', cursor: 'pointer', color: chipTextColor(r.status), display: 'flex', padding: 0, opacity: r.status === 'error' ? 1 : 0.5 }}>
                    <RotateCcw size={10} />
                  </button>
                )}
                {(r.status === 'done' || r.status === 'prompt') && (
                  <button title="Refine with instructions" onClick={() => setRefineTarget(rt => rt === r.id ? null : r.id)}
                    className="chip-action" style={{ background: 'none', border: 'none', cursor: 'pointer', color: refineTarget === r.id ? 'var(--purple)' : chipTextColor(r.status), display: 'flex', padding: 0, opacity: refineTarget === r.id ? 1 : 0.5 }}>
                    <Pencil size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Refine panel */}
        {!collapsed && refineTarget && (() => {
          const r = results.find(x => x.id === refineTarget)
          return r ? (
            <div style={{ padding: '8px 20px 12px', borderTop: '1px solid var(--border)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CornerDownRight size={13} color="var(--purple)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500, flexShrink: 0 }}>Refine {r.name}:</span>
              <input
                value={amendments[refineTarget] || ''}
                onChange={e => onAmendmentChange?.(refineTarget, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRefineSubmit(refineTarget)}
                placeholder='e.g. "Add a data migration risks section" or "Use RAG status for all items"'
                autoFocus
                style={{
                  flex: 1, fontSize: 12, padding: '6px 10px',
                  border: '1px solid var(--pm)', borderRadius: 7, outline: 'none',
                  background: 'var(--pl)', color: 'var(--pd)', fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button onClick={() => handleRefineSubmit(refineTarget)} disabled={!(amendments[refineTarget] || '').trim()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  background: 'var(--purple)', color: '#fff', border: 'none',
                  cursor: (amendments[refineTarget] || '').trim() ? 'pointer' : 'not-allowed',
                  opacity: (amendments[refineTarget] || '').trim() ? 1 : 0.5,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                <RotateCcw size={11} /> Regenerate
              </button>
              <button onClick={() => setRefineTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>
          ) : null
        })()}

        {!collapsed && <div style={{ height: 12 }} />}
      </div>
    </>
  )
}
