import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { callClaudeJSON } from './api.js'

const EXTRACT_PROMPT = `Extract project context from this Statement of Work document.
Return JSON with exactly these keys (use empty string "" if not found):
{
  "pname": "project name",
  "cname": "client / company name",
  "dm": "delivery manager or project manager name",
  "start": "project start date in YYYY-MM-DD format or empty string",
  "method": "one of: Agile Scrum | Agile Kanban | Hybrid (Agile + Waterfall) | Waterfall / Phased",
  "sprint": "one of: 1 week | 2 weeks | 3 weeks | 4 weeks",
  "team": "team size and composition summary",
  "tech": "key technologies and platforms",
  "industry": "client industry or sector",
  "scope": "2-4 sentence project scope summary"
}`

// Read a plain text file
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Read as ArrayBuffer (for docx + pdf)
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// Convert ArrayBuffer to base64
function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Extract text content from an example artefact file (.docx, .xlsx, .txt)
export async function extractExampleText(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'txt') return readAsText(file)

  if (ext === 'docx') {
    const buf = await readAsArrayBuffer(file)
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return result.value
  }

  if (ext === 'xlsx') {
    const buf = await readAsArrayBuffer(file)
    const wb = XLSX.read(buf, { type: 'array' })
    return wb.SheetNames.map(name => {
      const ws = wb.Sheets[name]
      return `=== ${name} ===\n${XLSX.utils.sheet_to_csv(ws)}`
    }).join('\n\n')
  }

  throw new Error(`Unsupported type .${ext}. Use .docx, .xlsx, or .txt.`)
}

// Extract raw text from the uploaded file
export async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'txt') {
    return { type: 'text', content: await readAsText(file) }
  }

  if (ext === 'docx') {
    const buf = await readAsArrayBuffer(file)
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return { type: 'text', content: result.value }
  }

  if (ext === 'pdf') {
    const buf = await readAsArrayBuffer(file)
    return { type: 'pdf', content: toBase64(buf) }
  }

  throw new Error(`Unsupported file type .${ext}. Please upload a .pdf, .docx, or .txt file.`)
}

// Call Claude to extract structured fields from a text SoW
async function extractFieldsFromText(text, opts) {
  return callClaudeJSON({
    ...opts,
    system: 'You are a project analyst. Extract structured project data from documents.',
    user: `${EXTRACT_PROMPT}\n\nDOCUMENT:\n${text.slice(0, 8000)}`,
  })
}

// Call Claude to extract structured fields from a PDF (sent as document block)
async function extractFieldsFromPdf(base64, opts) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: opts.model || 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'You are a project analyst. Extract structured project data from documents. Output ONLY valid JSON. No markdown fences, no prose.',
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.content.map(b => b.text || '').join('')
  return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())
}

// Main entry — extract + parse
export async function parseSoW(file, opts) {
  const extracted = await extractText(file)
  const fields = extracted.type === 'pdf'
    ? await extractFieldsFromPdf(extracted.content, opts)
    : await extractFieldsFromText(extracted.content, opts)

  // Normalise method/sprint to valid option values
  const methodMap = {
    scrum: 'Agile Scrum', kanban: 'Agile Kanban',
    hybrid: 'Hybrid (Agile + Waterfall)', waterfall: 'Waterfall / Phased', phased: 'Waterfall / Phased',
  }
  const sprintMap = { '1': '1 week', '2': '2 weeks', '3': '3 weeks', '4': '4 weeks' }

  const rawMethod = (fields.method || '').toLowerCase()
  const method = Object.entries(methodMap).find(([k]) => rawMethod.includes(k))?.[1] || 'Agile Scrum'

  const rawSprint = (fields.sprint || '').match(/\d/)?.[0] || '2'
  const sprint = sprintMap[rawSprint] || '2 weeks'

  // Return raw text for SoW field (used by Jira generator)
  const sowText = extracted.type === 'text' ? extracted.content : '[PDF — see uploaded document]'

  return { ...fields, method, sprint, sowText }
}
