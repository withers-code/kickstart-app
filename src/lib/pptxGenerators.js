import JSZip from 'jszip'
import { callClaudeJSON } from './api.js'
import { getDeliveryManagerPrompt, getSteeringPrompt } from './agilePrompts.js'

// ── Constants (16:9 widescreen) ───────────────────────────────────────────────
const W = 12192000   // 13.333 in
const H = 6858000    // 7.5 in
const PAD = 457200   // 0.5 in
const FOOTER_H = 160000
const TITLE_Y = 200000
const TITLE_H = 400000
const RULE_Y  = 625000
const RULE_H  = 27432
const BODY_Y  = 700000
const BODY_H  = H - BODY_Y - FOOTER_H - 60000  // ≈5838000

// ── XML helpers ───────────────────────────────────────────────────────────────
function hex6(h) { return (h || '#4F46E5').replace('#', '').toUpperCase().padEnd(6, '0') }
function esc(s)  { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function rPr(sz, bold, color) {
  return `<a:rPr lang="en-GB" sz="${sz}" b="${bold?1:0}" dirty="0"><a:solidFill><a:srgbClr val="${hex6(color)}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr>`
}
function run(text, sz, bold, color) { return `<a:r>${rPr(sz,bold,color)}<a:t>${esc(text)}</a:t></a:r>` }
function para(runs, align='l') { return `<a:p><a:pPr algn="${align}"/>${runs}</a:p>` }
function txBody(paras) { return `<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paras}</p:txBody>` }

function rect(id, x, y, w, h, fill) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="r${id}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${hex6(fill)}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>${txBody(para(''))}</p:sp>`
}
function textBox(id, x, y, w, h, paras) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="t${id}"/><p:cNvSpPr txBox="1"><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>${txBody(paras)}</p:sp>`
}
function slideWrap(spTree) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/><a:chOff x="0" y="0"/><a:chExt cx="${W}" cy="${H}"/></a:xfrm></p:grpSpPr>
${spTree}
</p:spTree></p:cSld>
<p:clrMapOvr><a:masterClr/></p:clrMapOvr></p:sld>`
}

// ── Slide chrome (title + rule + footer) ──────────────────────────────────────
function chrome(title, color) {
  return (
    textBox(2, PAD, TITLE_Y, W - PAD*2, TITLE_H, para(run(title, 2800, true, hex6(color)))) +
    rect(3, PAD, RULE_Y, W - PAD*2, RULE_H, hex6(color)) +
    rect(4, 0, H - FOOTER_H, W, FOOTER_H, hex6(color))
  )
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function ragFill(rag) {
  const r = String(rag || '').toLowerCase()
  if (r === 'green')  return { bg: 'DCFCE7', textColor: '166534' }
  if (r === 'amber' || r === 'yellow') return { bg: 'FEF9C3', textColor: '854D0E' }
  if (r === 'red')    return { bg: 'FEE2E2', textColor: '991B1B' }
  return { bg: 'F1F5F9', textColor: '475569' }
}
function ragBoxFill(rag) {
  const r = String(rag || '').toLowerCase()
  if (r === 'green')  return { bg: '22C55E', textColor: 'FFFFFF' }
  if (r === 'amber')  return { bg: 'F59E0B', textColor: 'FFFFFF' }
  if (r === 'red')    return { bg: 'EF4444', textColor: 'FFFFFF' }
  return { bg: 'CBD5E1', textColor: '1E293B' }
}
function statusCellFill(s) {
  const sl = String(s || '').toLowerCase()
  if (sl === 'complete')    return { bg: 'DCFCE7', textColor: '166534' }
  if (sl === 'in progress') return { bg: 'DBEAFE', textColor: '1E40AF' }
  if (sl === 'at risk')     return { bg: 'FEF9C3', textColor: '854D0E' }
  if (sl === 'blocked' || sl === 'overdue') return { bg: 'FEE2E2', textColor: '991B1B' }
  if (sl === 'not started') return { bg: 'F1F5F9', textColor: '64748B' }
  if (sl === 'open')        return { bg: 'FEF9C3', textColor: '854D0E' }
  if (sl === 'closed')      return { bg: 'F1F5F9', textColor: '64748B' }
  return { bg: 'F8FAFC', textColor: '475569' }
}
function severityFill(s) {
  const sl = String(s || '').toLowerCase()
  if (sl === 'high')   return { bg: 'FEE2E2', textColor: '991B1B' }
  if (sl === 'medium') return { bg: 'FEF9C3', textColor: '854D0E' }
  if (sl === 'low')    return { bg: 'F1F5F9', textColor: '475569' }
  return { bg: 'F8FAFC', textColor: '475569' }
}

function tblCell(text, { bg = 'FFFFFF', textColor = '1A1917', bold = false, sz = 1200, align = 'l' } = {}) {
  const b = 'E2E8F0'
  const borders = ['L','R','T','B'].map(d =>
    `<a:ln${d} w="9525" cmpd="sng"><a:solidFill><a:srgbClr val="${b}"/></a:solidFill></a:ln${d}>`
  ).join('')
  return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${para(run(String(text||''), sz, bold, textColor), align)}</a:txBody><a:tcPr>${borders}<a:solidFill><a:srgbClr val="${bg}"/></a:solidFill></a:tcPr></a:tc>`
}

function tblFrame(id, x, y, w, h, colWidths, tableRows) {
  const grid = colWidths.map(cw => `<a:gridCol w="${cw}"/>`).join('')
  const rowsXml = tableRows.map(({ cells, height }) =>
    `<a:tr h="${height}">${cells.join('')}</a:tr>`
  ).join('')
  return `<p:graphicFrame>
<p:nvGraphicFramePr><p:cNvPr id="${id}" name="tbl${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
<p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></p:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
<a:tbl><a:tblPr/><a:tblGrid>${grid}</a:tblGrid>${rowsXml}</a:tbl>
</a:graphicData></a:graphic></p:graphicFrame>`
}

function coloredHeaderTable(id, x, y, tblW, colWidths, headers, dataRows, headerColor) {
  const hdrH = 480000
  const n = Math.max(1, dataRows.length)
  const dataH = Math.floor((BODY_H - hdrH) / n)
  const tblH = hdrH + dataH * n
  const headerRow = {
    height: hdrH,
    cells: headers.map(h => tblCell(h, { bg: hex6(headerColor), textColor: 'FFFFFF', bold: true, sz: 1300 })),
  }
  const rows = dataRows.map(cells => ({ height: dataH, cells }))
  return { xml: tblFrame(id, x, y, tblW, tblH, colWidths, [headerRow, ...rows]), tblH }
}

// ── Slide layouts ─────────────────────────────────────────────────────────────

// Full-bleed color title slide
function titleSlide(title, subtitle, color) {
  const topH = Math.floor(H * 0.72)
  const barH = Math.floor(H * 0.09)
  const darkH = H - topH - barH
  const darkColor = '1E293B'
  const barColor = hex6(color)
  return slideWrap(
    rect(2, 0, 0, W, topH, hex6(color)) +
    textBox(3, PAD * 2, Math.floor(topH * 0.30), W - PAD * 4, Math.floor(topH * 0.55),
      para(run(title, 4400, true, 'FFFFFF'))) +
    rect(4, 0, topH, W, barH, barColor) +
    textBox(5, PAD * 2, topH + Math.floor(barH * 0.25), W - PAD * 4, Math.floor(barH * 0.6),
      para(run(subtitle, 1800, false, 'FFFFFF'))) +
    rect(6, 0, topH + barH, W, darkH, darkColor)
  )
}

// Standard bullets slide
function contentSlide(title, bullets, color) {
  const bParas = (bullets || []).map(b =>
    para(run('•  ' + b, 1600, false, '1A1917'))
  ).join('') || para(run('', 1600, false, '1A1917'))
  return slideWrap(
    chrome(title, color) +
    textBox(5, PAD, BODY_Y, W - PAD*2, BODY_H, bParas)
  )
}

// Exec summary — 4 RAG status boxes + highlights/blockers + stats panel
function execSummarySlide(title, ragBoxes, highlights, blockers, weekStats, color) {
  const GAP = 91440
  const boxCount = ragBoxes.length
  const totalW = W - PAD * 2
  const boxW = Math.floor((totalW - GAP * (boxCount - 1)) / boxCount)
  const boxH = 685800
  const labelH = Math.floor(boxH * 0.38)
  const statusH = Math.floor(boxH * 0.52)

  let boxXml = ''
  ragBoxes.forEach((box, i) => {
    const fills = ragBoxFill(box.status)
    const x = PAD + i * (boxW + GAP)
    const y = BODY_Y
    const idBase = 10 + i * 3
    boxXml +=
      rect(idBase, x, y, boxW, boxH, fills.bg) +
      textBox(idBase+1, x, y + Math.floor(boxH*0.08), boxW, labelH,
        para(run(box.label || '', 1500, false, fills.textColor), 'ctr')) +
      textBox(idBase+2, x, y + labelH + Math.floor(boxH*0.06), boxW, statusH,
        para(run((box.status || '').toUpperCase(), 2200, true, fills.textColor), 'ctr'))
  })

  const twoColY = BODY_Y + boxH + 160000
  const twoColH = BODY_H - boxH - 160000
  const midX = PAD + Math.floor(totalW * 0.55)
  const leftW = midX - PAD - GAP
  const rightW = totalW - (midX - PAD)

  const hlParas = [
    para(run('Key Highlights', 1600, true, hex6(color))),
    ...(highlights || []).map(h => para(run('•  ' + h, 1400, false, '1A1917'))),
    para(run('', 1200, false, '1A1917')),
    para(run('Blockers / Concerns', 1600, true, hex6(color))),
    ...(blockers || []).map(b => para(run('•  ' + b, 1400, false, '1A1917'))),
  ].join('')

  const statsParas = [
    para(run('Week at a Glance', 1600, true, hex6(color))),
    para(run('', 1000, false, '1A1917')),
    ...(weekStats
      ? [
          para(run('Sprint:  ' + (weekStats.sprint || 'TBC'), 1400, false, '374151')),
          para(run('Stories Completed:  ' + (weekStats.storiesCompleted || 'TBC'), 1400, false, '374151')),
          para(run('Story Points Burned:  ' + (weekStats.storyPoints || 'TBC'), 1400, false, '374151')),
          para(run('Defects Open:  ' + (weekStats.defectsOpen || '0'), 1400, false, '374151')),
          para(run('% Complete:  ' + (weekStats.percentComplete || 'TBC'), 1400, false, '374151')),
        ]
      : []),
  ].join('')

  return slideWrap(
    chrome(title, color) +
    boxXml +
    textBox(30, PAD, twoColY, leftW, twoColH, hlParas) +
    rect(31, midX, twoColY, GAP, twoColH, 'F1F5F9') +
    rect(32, midX + GAP, twoColY, rightW - GAP, twoColH, 'F1F5F9') +
    textBox(33, midX + GAP + Math.floor(PAD*0.5), twoColY + 120000, rightW - GAP - PAD, twoColH - 240000, statsParas)
  )
}

// Sprint / deliverable progress table
function sprintProgressSlide(title, items, color) {
  const tblW = W - PAD * 2
  const cols = [
    Math.floor(tblW * 0.28), Math.floor(tblW * 0.12),
    Math.floor(tblW * 0.13), Math.floor(tblW * 0.09),
    Math.floor(tblW * 0.13), Math.floor(tblW * 0.25),
  ]
  const headers = ['Deliverable / Story', 'Owner', 'Status', '% Done', 'Target Date', 'Notes']
  const dataRows = (items || []).map(r => ({
    cells: [
      tblCell(r.deliverable || '', { bg: 'FFFFFF', sz: 1200 }),
      tblCell(r.owner || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200 }),
      tblCell(r.status || '', { ...statusCellFill(r.status), bold: true, sz: 1200 }),
      tblCell(r.percentDone || '', { bg: 'FFFFFF', textColor: '374151', sz: 1200, align: 'ctr' }),
      tblCell(r.targetDate || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200 }),
      tblCell(r.notes || '', { bg: 'FFFFFF', textColor: '6B7280', sz: 1100 }),
    ],
  }))
  const { xml } = coloredHeaderTable(10, PAD, BODY_Y, tblW, cols, headers, dataRows.map(r => r.cells), color)
  return slideWrap(chrome(title, color) + xml)
}

// Risks & Issues table (ID, Risk/Issue, Type, Severity, Owner, Mitigation, Status)
function risksIssuesSlide(title, items, color) {
  const tblW = W - PAD * 2
  const cols = [
    Math.floor(tblW * 0.05), Math.floor(tblW * 0.22),
    Math.floor(tblW * 0.07), Math.floor(tblW * 0.09),
    Math.floor(tblW * 0.10), Math.floor(tblW * 0.35),
    Math.floor(tblW * 0.12),
  ]
  const headers = ['ID', 'Risk / Issue', 'Type', 'Severity', 'Owner', 'Mitigation / Action', 'Status']
  const dataRows = (items || []).map(r => [
    tblCell(r.id || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200, align: 'ctr' }),
    tblCell(r.text || r.risk || '', { bg: 'FFFFFF', sz: 1200 }),
    tblCell(r.type || 'Risk', { bg: 'F8FAFC', textColor: '475569', sz: 1200, align: 'ctr' }),
    tblCell(r.severity || '', { ...severityFill(r.severity), bold: true, sz: 1200, align: 'ctr' }),
    tblCell(r.owner || '', { bg: 'FFFFFF', textColor: '475569', sz: 1200 }),
    tblCell(r.mitigation || '', { bg: 'FAFAFA', textColor: '374151', sz: 1100 }),
    tblCell(r.status || '', { ...statusCellFill(r.status), bold: true, sz: 1200, align: 'ctr' }),
  ])
  const { xml } = coloredHeaderTable(10, PAD, BODY_Y, tblW, cols, headers, dataRows, color)
  return slideWrap(chrome(title, color) + xml)
}

// Upcoming week — two columns with multiple sections
function upcomingWeekSlide(title, priorities, milestones, decisions, dependencies, color) {
  const GAP = 91440
  const totalW = W - PAD * 2
  const colW = Math.floor(totalW / 2) - Math.floor(GAP / 2)
  const rightX = PAD + colW + GAP

  const leftParas = [
    para(run('Next Week Priorities', 1600, true, hex6(color))),
    ...(priorities || []).map(p => para(run('•  ' + p, 1400, false, '1A1917'))),
    para(run('', 1000, false, '1A1917')),
    para(run('Key Milestones Ahead', 1600, true, hex6(color))),
    ...(milestones || []).map(m => para(run('•  ' + m, 1400, false, '1A1917'))),
  ].join('')

  const rightParas = [
    para(run('Decisions Needed', 1600, true, hex6(color))),
    ...(decisions || []).map(d => para(run('•  ' + d, 1400, false, '1A1917'))),
    para(run('', 1000, false, '1A1917')),
    para(run('Dependencies', 1600, true, hex6(color))),
    ...(dependencies || []).map(d => para(run('•  ' + d, 1400, false, '1A1917'))),
  ].join('')

  return slideWrap(
    chrome(title, color) +
    textBox(5, PAD, BODY_Y, colW, BODY_H, leftParas) +
    rect(6, PAD + colW, BODY_Y, GAP, BODY_H, 'E2E8F0') +
    textBox(7, rightX, BODY_Y, colW, BODY_H, rightParas)
  )
}

// Action log table
function actionLogSlide(title, items, color) {
  const tblW = W - PAD * 2
  const cols = [
    Math.floor(tblW * 0.05), Math.floor(tblW * 0.38),
    Math.floor(tblW * 0.12), Math.floor(tblW * 0.13),
    Math.floor(tblW * 0.12), Math.floor(tblW * 0.20),
  ]
  const headers = ['#', 'Action', 'Owner', 'Due Date', 'Priority', 'Status']
  const dataRows = (items || []).map(r => [
    tblCell(r.id || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200, align: 'ctr' }),
    tblCell(r.action || '', { bg: 'FFFFFF', sz: 1200 }),
    tblCell(r.owner || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200 }),
    tblCell(r.dueDate || '', { bg: 'FFFFFF', textColor: '475569', sz: 1200 }),
    tblCell(r.priority || '', { ...severityFill(r.priority), bold: true, sz: 1200, align: 'ctr' }),
    tblCell(r.status || '', { ...statusCellFill(r.status), bold: true, sz: 1200, align: 'ctr' }),
  ])
  const { xml } = coloredHeaderTable(10, PAD, BODY_Y, tblW, cols, headers, dataRows, color)
  return slideWrap(chrome(title, color) + xml)
}

// Key-value overview table (for kick-off / delivery)
function overviewTableSlide(title, rows, color) {
  const tblW = W - PAD * 2
  const rowH = Math.min(530000, Math.floor(BODY_H / Math.max(1, rows.length)))
  const tblH = rowH * rows.length
  const col1W = Math.floor(tblW * 0.25)
  const tableRows = rows.map(([key, value, rag]) => ({
    height: rowH,
    cells: [
      tblCell(key, { bg: 'F1F5F9', textColor: '475569', bold: true, sz: 1300 }),
      rag
        ? tblCell(value, { ...ragFill(rag), bold: true, sz: 1300 })
        : tblCell(value, { bg: 'FFFFFF', textColor: '1A1917', sz: 1400 }),
    ],
  }))
  return slideWrap(
    chrome(title, color) +
    tblFrame(10, PAD, BODY_Y, tblW, tblH, [col1W, tblW - col1W], tableRows)
  )
}

// Two equal columns
function twoColSlide(title, leftTitle, leftBullets, rightTitle, rightBullets, color) {
  const GAP = 91440
  const totalW = W - PAD * 2
  const colW = Math.floor(totalW / 2) - Math.floor(GAP / 2)
  const rightX = PAD + colW + GAP
  const subH = 340000
  const listY = BODY_Y + subH + 80000
  const listH = BODY_H - subH - 80000
  const lPars = (leftBullets || []).map(b => para(run('•  ' + b, 1400, false, '1A1917'))).join('')
  const rPars = (rightBullets || []).map(b => para(run('•  ' + b, 1400, false, '1A1917'))).join('')
  return slideWrap(
    chrome(title, color) +
    textBox(5, PAD, BODY_Y, colW, subH, para(run(leftTitle || '', 1700, true, hex6(color)))) +
    textBox(6, PAD, listY, colW, listH, lPars) +
    rect(7, PAD + colW, BODY_Y, GAP, BODY_H, 'E2E8F0') +
    textBox(8, rightX, BODY_Y, colW, subH, para(run(rightTitle || '', 1700, true, hex6(color)))) +
    textBox(9, rightX, listY, colW, listH, rPars)
  )
}

// Colored-header data table (generic)
function ragTableSlide(title, risks, color) {
  const tblW = W - PAD * 2
  const cols = [
    Math.floor(tblW * 0.32), Math.floor(tblW * 0.08),
    Math.floor(tblW * 0.40), Math.floor(tblW * 0.20),
  ]
  const headers = ['Risk / Issue', 'RAG', 'Mitigation', 'Owner']
  const dataRows = (risks || []).map(r => [
    tblCell(r.text || r.risk || '', { bg: 'FFFFFF', sz: 1200 }),
    tblCell(r.rag || '', { ...ragFill(r.rag), bold: true, sz: 1200, align: 'ctr' }),
    tblCell(r.mitigation || '', { bg: 'FAFAFA', textColor: '475569', sz: 1200 }),
    tblCell(r.owner || '', { bg: 'FFFFFF', textColor: '475569', sz: 1200 }),
  ])
  const { xml } = coloredHeaderTable(10, PAD, BODY_Y, tblW, cols, headers, dataRows, color)
  return slideWrap(chrome(title, color) + xml)
}

function milestoneTableSlide(title, items, color) {
  const tblW = W - PAD * 2
  const cols = [Math.floor(tblW * 0.55), Math.floor(tblW * 0.20), Math.floor(tblW * 0.25)]
  const headers = ['Milestone', 'Planned Date', 'Status']
  const dataRows = (items || []).map(m => [
    tblCell(m.name || m.milestone || '', { bg: 'FFFFFF', sz: 1200 }),
    tblCell(m.date || m.plannedDate || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200 }),
    tblCell(m.status || '', { ...statusCellFill(m.status), bold: true, sz: 1200, align: 'ctr' }),
  ])
  const { xml } = coloredHeaderTable(10, PAD, BODY_Y, tblW, cols, headers, dataRows, color)
  return slideWrap(chrome(title, color) + xml)
}

// ── PPTX package XML ──────────────────────────────────────────────────────────
function contentTypes(n) {
  const overrides = Array.from({length: n}, (_, i) =>
    `<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${overrides}</Types>`
}
const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
const slideRel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="blank" preserve="1">
<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClr/></p:clrMapOvr></p:sldLayout>`
const slideLayoutRel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
const slideMasterRel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
function slideMasterXml(color) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg>
<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
<p:txStyles>
<p:titleStyle><a:lvl1pPr><a:defRPr sz="3200" b="1"><a:solidFill><a:srgbClr val="${hex6(color)}"/></a:solidFill><a:latin typeface="Calibri"/></a:defRPr></a:lvl1pPr></p:titleStyle>
<p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"><a:latin typeface="Calibri"/></a:defRPr></a:lvl1pPr></p:bodyStyle>
<p:otherStyle><a:defPPr><a:defRPr><a:latin typeface="Calibri"/></a:defRPr></a:defPPr></p:otherStyle>
</p:txStyles></p:sldMaster>`
}
function themeXml(color) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Theme">
<a:themeElements>
<a:clrScheme name="Scheme">
<a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="1E293B"/></a:dk2><a:lt2><a:srgbClr val="F3F3F3"/></a:lt2>
<a:accent1><a:srgbClr val="${hex6(color)}"/></a:accent1>
<a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A9D18E"/></a:accent3>
<a:accent4><a:srgbClr val="4472C4"/></a:accent4><a:accent5><a:srgbClr val="5C9BD5"/></a:accent5>
<a:accent6><a:srgbClr val="70AD47"/></a:accent6>
<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
</a:clrScheme>
<a:fontScheme name="Office">
<a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
</a:fontScheme>
<a:fmtScheme name="Office">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements></a:theme>`
}
function presentationXml(n) {
  const ids = Array.from({length: n}, (_, i) => `<p:sldId id="${256+i}" r:id="rId${i+2}"/>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" saveSubsetFonts="1">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${ids}</p:sldIdLst>
<p:sldSz cx="${W}" cy="${H}" type="screen16x9"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
}
function presentationRels(n) {
  const slides = Array.from({length: n}, (_, i) =>
    `<Relationship Id="rId${i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`
  ).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${slides}</Relationships>`
}

// ── Builder ───────────────────────────────────────────────────────────────────
async function buildPptxFromSlides(slideXmls, theme, deckTitle, deckSubtitle) {
  const color = theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const allSlides = [titleSlide(deckTitle, deckSubtitle || `Week Ending: ${date}`, color), ...slideXmls]
  const n = allSlides.length
  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypes(n))
  zip.file('_rels/.rels', rootRels)
  zip.file('ppt/presentation.xml', presentationXml(n))
  zip.file('ppt/_rels/presentation.xml.rels', presentationRels(n))
  zip.file('ppt/theme/theme1.xml', themeXml(color))
  zip.file('ppt/slideMasters/slideMaster1.xml', slideMasterXml(color))
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', slideMasterRel)
  zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayoutXml)
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slideLayoutRel)
  allSlides.forEach((xml, i) => {
    zip.file(`ppt/slides/slide${i+1}.xml`, xml)
    zip.file(`ppt/slides/_rels/slide${i+1}.xml.rels`, slideRel)
  })
  return zip.generateAsync({ type: 'arraybuffer' })
}

// ── Exports ───────────────────────────────────────────────────────────────────
export async function genPptxStatusReport(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB')
  const d = await callClaudeJSON({
    ...opts,
    system: getDeliveryManagerPrompt(),
    user: `Generate a weekly delivery status report presentation. Be specific and professional — write as a senior project manager would.
Project: ${ctx.pname} | Client: ${ctx.cname} | DM: ${ctx.dm || 'TBC'} | Method: ${ctx.method || 'Agile'}
Scope: ${ctx.scope}${ctx.sow ? `\n\nStatement of Work:\n${ctx.sow.slice(0,2500)}` : ''}
${ctx.instructions?.['status-report'] ? `\nCUSTOM INSTRUCTIONS: ${ctx.instructions['status-report']}` : ''}

Return ONLY this exact JSON (no markdown fences, no extra fields):
{
  "ragBoxes": [
    {"label":"Overall","status":"Green|Amber|Red"},
    {"label":"Schedule","status":"Green|Amber|Red"},
    {"label":"Budget","status":"Green|Amber|Red"},
    {"label":"Quality","status":"Green|Amber|Red"}
  ],
  "highlights": ["string x3-4"],
  "blockers": ["string x2-3"],
  "weekStats": {"sprint":"X of Y","storiesCompleted":"X / Y","storyPoints":"X / Y","defectsOpen":"X","percentComplete":"X%"},
  "sprintProgress": [
    {"deliverable":"string","owner":"string","status":"Complete|In Progress|Not Started|At Risk|Blocked","percentDone":"X%","targetDate":"DD/MM/YYYY","notes":"string"}
  ],
  "risks": [
    {"id":"R1","text":"string","type":"Risk|Issue","severity":"High|Medium|Low","owner":"string","mitigation":"string","status":"Open|In Progress|Closed"}
  ],
  "nextWeekPriorities": ["string x4"],
  "milestonesAhead": ["DD/MM/YYYY — milestone description x2-3"],
  "decisionsNeeded": ["string x2-3"],
  "dependencies": ["string x2-3"],
  "actions": [
    {"id":"A1","action":"string","owner":"string","dueDate":"DD/MM/YYYY","priority":"High|Medium|Low","status":"Open|In Progress|Complete|Overdue"}
  ]
}`,
  })
  const slides = [
    execSummarySlide('Executive Summary', d.ragBoxes || [], d.highlights || [], d.blockers || [], d.weekStats || null, color),
    sprintProgressSlide('Sprint / Milestone Progress', d.sprintProgress || [], color),
    risksIssuesSlide('Risks & Issues', d.risks || [], color),
    upcomingWeekSlide('Upcoming Week & Decisions', d.nextWeekPriorities || [], d.milestonesAhead || [], d.decisionsNeeded || [], d.dependencies || [], color),
    actionLogSlide('Action Log', d.actions || [], color),
  ]
  return buildPptxFromSlides(slides, ctx.theme, `Weekly Delivery Status Report`, `${ctx.pname}  ·  Week Ending: ${date}`)
}

export async function genKickoffDeck(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const d = await callClaudeJSON({
    ...opts,
    system: getDeliveryManagerPrompt(),
    user: `Generate a project kick-off presentation. Write as a senior consultant — specific, professional, no generic filler.
Project: ${ctx.pname} | Client: ${ctx.cname} | Start: ${ctx.start || 'TBC'} | Method: ${ctx.method} | Sprint: ${ctx.sprint}
Team: ${ctx.team} | Tech: ${ctx.tech || 'TBC'} | Industry: ${ctx.industry || 'TBC'}
Scope: ${ctx.scope}${ctx.sow ? `\n\nStatement of Work:\n${ctx.sow.slice(0,2500)}` : ''}
${ctx.instructions?.['kick-off-deck'] ? `\nCUSTOM INSTRUCTIONS: ${ctx.instructions['kick-off-deck']}` : ''}

Return ONLY this JSON (no markdown, no extra fields):
{
  "agenda": ["string x6-7"],
  "objectives": ["string x4-5"],
  "inScope": ["string x4-6"],
  "outOfScope": ["string x3-4"],
  "clientTeam": [{"name":"string","role":"string"} x3-4],
  "deliveryTeam": [{"name":"string","role":"string"} x3-4],
  "approach": ["string x5-6"],
  "milestones": [{"name":"string","date":"DD/MM/YYYY","status":"On Track"} x5-7],
  "waysOfWorking": ["string x5-6"],
  "nextSteps": ["string x4-5"]
}`,
  })
  const slides = [
    contentSlide('Agenda', d.agenda || [], color),
    overviewTableSlide('Project Overview', [
      ['Project', ctx.pname || ''],
      ['Client', ctx.cname || ''],
      ['Start Date', ctx.start || 'TBC'],
      ['Methodology', ctx.method || 'Agile Scrum'],
      ['Sprint Length', ctx.sprint || '2 weeks'],
      ['Team', ctx.team || 'TBC'],
    ], color),
    contentSlide('Objectives', d.objectives || [], color),
    twoColSlide('Scope', 'In Scope', d.inScope || [], 'Out of Scope', d.outOfScope || [], color),
    twoColSlide('Meet the Team',
      `${ctx.cname || 'Client'} Team`, (d.clientTeam || []).map(p => `${p.name} — ${p.role}`),
      'Delivery Team', (d.deliveryTeam || []).map(p => `${p.name} — ${p.role}`),
      color),
    contentSlide('Delivery Approach', d.approach || [], color),
    milestoneTableSlide('Timeline & Milestones', d.milestones || [], color),
    contentSlide('Ways of Working', d.waysOfWorking || [], color),
    contentSlide('Next Steps', d.nextSteps || [], color),
  ]
  return buildPptxFromSlides(slides, ctx.theme, `Kick-off Presentation`, ctx.pname || '')
}

export async function genDeliveryReport(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB')
  const d = await callClaudeJSON({
    ...opts,
    system: getDeliveryManagerPrompt(),
    user: `Generate a delivery status report presentation. Write as a senior project manager — specific, professional.
Project: ${ctx.pname} | Client: ${ctx.cname} | DM: ${ctx.dm || 'TBC'} | Method: ${ctx.method}
Scope: ${ctx.scope}${ctx.sow ? `\n\nStatement of Work:\n${ctx.sow.slice(0,2500)}` : ''}
${ctx.instructions?.['delivery-report'] ? `\nCUSTOM INSTRUCTIONS: ${ctx.instructions['delivery-report']}` : ''}

Return ONLY this JSON (no markdown, no extra fields):
{
  "rag": "Green|Amber|Red",
  "summary": "2-3 sentence executive summary paragraph",
  "statusRows": [["Budget","On Track"],["Timeline","On Track"],["Scope","Stable"],["Team","Fully resourced"],["Client Satisfaction","High"]],
  "completed": ["string x5-6"],
  "upcoming": ["string x5-6"],
  "risks": [{"text":"string","rag":"Green|Amber|Red","mitigation":"string","owner":"string"} x4-5],
  "milestones": [{"name":"string","date":"DD/MM/YYYY","status":"Complete|On Track|At Risk|Delayed"} x5-6],
  "nextSteps": ["string x4-5"]
}`,
  })
  const summaryText = d.summary || ''
  const statusRows = [
    ['Project', ctx.pname || ''],
    ['Client', ctx.cname || ''],
    ['Report Date', date],
    ['Overall RAG', d.rag || 'Green', d.rag],
    ...(d.statusRows || []).map(([k, v]) => [k, v]),
  ]
  const slides = [
    overviewTableSlide('Project Status', statusRows, color),
    contentSlide('Executive Summary', summaryText ? [summaryText] : [], color),
    twoColSlide('Delivery Progress', 'Completed', d.completed || [], 'Upcoming', d.upcoming || [], color),
    ragTableSlide('Risks & Issues', d.risks || [], color),
    milestoneTableSlide('Milestones', d.milestones || [], color),
    contentSlide('Next Steps', d.nextSteps || [], color),
  ]
  return buildPptxFromSlides(slides, ctx.theme, `Delivery Report`, ctx.pname || '')
}

// ── Steering Committee Pack ────────────────────────────────────────────────────
function steeringDecisionsSlide(title, decisions, color) {
  const BOX_H = 980000
  const BOX_GAP = 60000
  const cols = Math.min(decisions.length, 3)
  const boxW = Math.floor((W - PAD * 2 - BOX_GAP * (cols - 1)) / cols)
  let shapes = chrome(title, color)
  decisions.slice(0, 3).forEach((d, i) => {
    const x = PAD + i * (boxW + BOX_GAP)
    const y = BODY_Y + 40000
    shapes += rect(10 + i * 4, x, y, boxW, BOX_H, hex6(color))
    shapes += textBox(11 + i * 4, x + 30000, y + 30000, boxW - 60000, BOX_H - 60000,
      para(run(`Decision ${i + 1}`, 1600, true, 'FFFFFF'), 'l') +
      para(run(d.decision || '', 1400, false, 'FFFFFF'), 'l') +
      para('') +
      para(run(`Owner: ${d.owner || ''}`, 1200, false, 'FFDE7A'), 'l') +
      para(run(`By: ${d.deadline || ''}`, 1200, false, 'FFDE7A'), 'l') +
      para('') +
      para(run(`⚠ ${d.consequence || ''}`, 1200, true, 'FFB3B3'), 'l')
    )
  })
  if (decisions.length > 3) {
    const y2 = BODY_Y + BOX_H + BOX_GAP + 80000
    decisions.slice(3, 6).forEach((d, i) => {
      const x = PAD + i * (boxW + BOX_GAP)
      shapes += rect(22 + i * 4, x, y2, boxW, BOX_H * 0.8, hex6(color))
      shapes += textBox(23 + i * 4, x + 30000, y2 + 30000, boxW - 60000, BOX_H * 0.8 - 60000,
        para(run(`Decision ${i + 4}`, 1400, true, 'FFFFFF'), 'l') +
        para(run(d.decision || '', 1300, false, 'FFFFFF'), 'l') +
        para(run(`${d.owner || ''} · ${d.deadline || ''}`, 1100, false, 'FFDE7A'), 'l')
      )
    })
  }
  return slideWrap(shapes)
}

function steeringFinanceSlide(title, budget, color) {
  const rows = [
    ['Total Budget', budget.totalBudget || 'TBC', 'Green'],
    ['Spent to Date', budget.spent || 'TBC', budget.spentRag || 'Green'],
    ['Forecast at Completion', budget.forecast || 'TBC', budget.forecastRag || 'Green'],
    ['Remaining', budget.remaining || 'TBC', budget.remainingRag || 'Green'],
    ['Contingency Used', budget.contingencyUsed || '0%', budget.contingencyRag || 'Green'],
  ]
  return coloredHeaderTable(
    title, PAD, BODY_Y, W - PAD * 2,
    [Math.floor((W - PAD * 2) * 0.45), Math.floor((W - PAD * 2) * 0.35), Math.floor((W - PAD * 2) * 0.20)],
    ['Budget Line', 'Value', 'Status'],
    rows.map(([label, val, rag]) => {
      const fill = ragFill(rag)
      return [
        { text: label, color: '1E293B', bold: false, bg: 'FFFFFF' },
        { text: val, color: '1E293B', bold: true, bg: 'FFFFFF' },
        { text: rag, color: fill.textColor, bold: true, bg: fill.bg },
      ]
    }),
    hex6(color)
  )
}

export async function genPptxSteeringPack(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const d = await callClaudeJSON({
    ...opts,
    system: getSteeringPrompt(),
    user: `Generate steering committee pack content. Project: ${ctx.pname} | Client: ${ctx.cname} | Scope: ${ctx.scope} | Team: ${ctx.team} | Start: ${ctx.start}${ctx.sow ? `\n\nSOW:\n${ctx.sow.slice(0, 3000)}` : ''}${ctx.instructions?.['steering-pack'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['steering-pack']}` : ''}
Return ONLY this JSON:
{
  "overallRag": "Green|Amber|Red",
  "reportingPeriod": "e.g. Sprint 3 — Week 12",
  "keyStats": [{"label":"Sprints Complete","value":"3 of 8"},{"label":"Budget Consumed","value":"36%"},{"label":"Open Risks","value":"4"},{"label":"Milestones On Track","value":"3 of 5"}],
  "ragBoxes": [{"area":"Schedule","status":"Green|Amber|Red","headline":"short summary"},{"area":"Budget","status":"Green|Amber|Red","headline":"short summary"},{"area":"Quality","status":"Green|Amber|Red","headline":"short summary"},{"area":"Risk","status":"Green|Amber|Red","headline":"short summary"}],
  "decisions": [{"decision":"decision text — be specific","owner":"role or name","deadline":"DD/MM/YYYY","consequence":"what happens if not decided"} x3-5],
  "budget": {"totalBudget":"£XXX,XXX","spent":"£XX,XXX","forecast":"£XXX,XXX","remaining":"£XX,XXX","contingencyUsed":"X%","spentRag":"Green","forecastRag":"Green","remainingRag":"Green","contingencyRag":"Green"},
  "risks": [{"id":"R1","description":"risk description","severity":"High|Medium|Low","recommendation":"recommended action"} x3],
  "next30Days": ["milestone or deliverable" x5]
}`,
  })

  const overviewRows = [
    ['Project', ctx.pname || '', null],
    ['Client', ctx.cname || '', null],
    ['Reporting Period', d.reportingPeriod || date, null],
    ['Overall Status', d.overallRag || 'Green', d.overallRag],
    ...(d.keyStats || []).map(s => [s.label, s.value, null]),
  ]

  const slides = [
    overviewTableSlide('Project Overview', overviewRows, color),
    execSummarySlide('RAG Status Dashboard',
      d.ragBoxes || [{ area: 'Schedule', status: 'Green', headline: 'On Track' }],
      [], [],
      (d.keyStats || []).map(s => ({ label: s.label, value: s.value })),
      color
    ),
    steeringDecisionsSlide('Decisions Required', d.decisions || [], color),
    steeringFinanceSlide('Financial Summary', d.budget || {}, color),
    risksIssuesSlide('Key Risks for Escalation',
      (d.risks || []).map(r => ({ id: r.id, text: r.description, type: 'Risk', severity: r.severity, owner: '', mitigation: r.recommendation, status: 'Open' })),
      color
    ),
    contentSlide('Next 30 Days', d.next30Days || [], color),
  ]
  return buildPptxFromSlides(slides, ctx.theme, 'Steering Committee Pack', ctx.pname || '')
}
