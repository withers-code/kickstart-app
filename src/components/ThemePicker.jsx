import React, { useRef, useState } from 'react'
import JSZip from 'jszip'
import { Paperclip, X } from 'lucide-react'
import { THEME_PRESETS } from '../lib/constants.js'
import { Field, FormGrid, Input } from './ui.jsx'
import { Spinner } from './ui.jsx'

async function extractPptxThemeColors(file) {
  const buf = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buf)

  // Theme XML is typically at ppt/theme/theme1.xml
  const themeEntry = zip.file('ppt/theme/theme1.xml')
  if (!themeEntry) return null

  const xml = await themeEntry.async('string')

  function pick(tag) {
    // Match <a:TAG ...><a:srgbClr val="XXXXXX"/>
    const m = xml.match(new RegExp(`<a:${tag}[^>]*>\\s*<a:srgbClr val="([0-9A-Fa-f]{6})"`, 'i'))
    if (m) return '#' + m[1].toUpperCase()
    // Also try sysClr lastClr attribute
    const m2 = xml.match(new RegExp(`<a:${tag}[^>]*>\\s*<a:sysClr[^>]+lastClr="([0-9A-Fa-f]{6})"`, 'i'))
    if (m2) return '#' + m2[1].toUpperCase()
    return null
  }

  return {
    primary:   pick('accent1'),
    secondary: pick('dk2') || pick('accent2'),
    accent:    pick('accent2'),
  }
}

export default function ThemePicker({ theme, setTheme, uploadedFile, setUploadedFile }) {
  const fileRef = useRef()
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState(null)

  function selectPreset(key) {
    const p = THEME_PRESETS[key]
    setTheme({ ...theme, presetKey: key, primary: p.primary, secondary: p.secondary, accent: p.accent })
  }

  async function handleFile(file) {
    if (!file) return
    setUploadedFile(file)
    setExtractError(null)

    if (/\.(pptx|potx)$/i.test(file.name)) {
      setExtracting(true)
      try {
        const colors = await extractPptxThemeColors(file)
        if (colors?.primary) {
          setTheme(t => ({
            ...t,
            presetKey: 'custom',
            fileName: file.name,
            primary:   colors.primary,
            secondary: colors.secondary || t.secondary,
            accent:    colors.accent    || t.accent,
          }))
        } else {
          setTheme(t => ({ ...t, presetKey: 'custom', fileName: file.name }))
          setExtractError('No theme colours found in this file — set them manually below.')
        }
      } catch {
        setTheme(t => ({ ...t, presetKey: 'custom', fileName: file.name }))
        setExtractError('Could not read theme colours — set them manually below.')
      } finally {
        setExtracting(false)
      }
    } else {
      setTheme(t => ({ ...t, presetKey: 'custom', fileName: file.name }))
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {/* Presets */}
      <div style={{ marginBottom: 12 }}>
        <Field label="Theme preset">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {Object.entries(THEME_PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => selectPreset(key)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${theme.presetKey === key ? 'var(--text)' : 'var(--border-mid)'}`,
                  cursor: 'pointer',
                  background: theme.presetKey === key ? 'var(--text)' : 'var(--surface)',
                  color: theme.presetKey === key ? 'var(--surface)' : 'var(--t2)',
                  transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.primary, display: 'inline-block', flexShrink: 0 }} />
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setTheme(t => ({ ...t, presetKey: 'custom' }))}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: `1px solid ${theme.presetKey === 'custom' ? 'var(--text)' : 'var(--border-mid)'}`,
                cursor: 'pointer',
                background: theme.presetKey === 'custom' ? 'var(--text)' : 'var(--surface)',
                color: theme.presetKey === 'custom' ? 'var(--surface)' : 'var(--t2)',
                transition: 'all 0.12s',
              }}
            >
              Custom
            </button>
          </div>
        </Field>
      </div>

      <FormGrid cols={2}>
        {/* Upload zone */}
        <div>
          <Field label="Upload PowerPoint theme (.pptx / .potx) — colours auto-extracted">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !extracting && fileRef.current?.click()}
              style={{
                border: '2px dashed var(--border-mid)', borderRadius: 10,
                padding: 16, textAlign: 'center', cursor: extracting ? 'default' : 'pointer',
                transition: 'all 0.15s', background: 'var(--bg)',
                position: 'relative', overflow: 'hidden', marginTop: 4,
              }}
            >
              <input ref={fileRef} type="file" accept=".pptx,.potx,.ppt" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
              <div style={{ fontSize: 22, marginBottom: 5 }}>📎</div>
              {extracting ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)' }}>
                  <Spinner size={12} /> Extracting theme colours…
                </div>
              ) : uploadedFile ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--gl)', color: 'var(--green)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                  <Paperclip size={12} />
                  {uploadedFile.name}
                  <button
                    onClick={e => { e.stopPropagation(); setUploadedFile(null); setExtractError(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', lineHeight: 1, padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: 'var(--t2)' }}>Drop a PowerPoint theme file here</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>or click to browse</div>
                </>
              )}
            </div>
            {extractError && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>{extractError}</div>}
            {uploadedFile && !extracting && !extractError && (
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 5 }}>
                Theme colours extracted and applied below.
              </div>
            )}
          </Field>
        </div>

        {/* Manual hex inputs */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <Field label="Primary colour (hex)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: theme.primary, border: '1px solid var(--border-mid)', flexShrink: 0 }} />
                <Input value={theme.primary} onChange={e => setTheme(t => ({ ...t, primary: e.target.value, presetKey: 'custom' }))} style={{ fontFamily: "'DM Mono', monospace" }} />
              </div>
            </Field>
            <Field label="Secondary colour">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: theme.secondary, border: '1px solid var(--border-mid)', flexShrink: 0 }} />
                <Input value={theme.secondary} onChange={e => setTheme(t => ({ ...t, secondary: e.target.value, presetKey: 'custom' }))} style={{ fontFamily: "'DM Mono', monospace" }} />
              </div>
            </Field>
          </div>
        </div>
      </FormGrid>
    </div>
  )
}
