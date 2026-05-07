import JSZip from 'jszip'
import { callClaudeJSON } from './api.js'

const W = 9144000
const H = 6858000
const PAD = 457200
const HDR = 685800

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

// ── Table helpers ─────────────────────────────────────────────────────────────
function ragFill(rag) {
  const r = String(rag || '').toLowerCase()
  if (r === 'green')  return { bg: 'DCFCE7', textColor: '166534' }
  if (r === 'amber' || r === 'yellow') return { bg: 'FEF9C3', textColor: '854D0E' }
  if (r === 'red')    return { bg: 'FEE2E2', textColor: '991B1B' }
  return { bg: 'F1F5F9', textColor: '475569' }
}
function statusFill(s) {
  const sl = String(s || '').toLowerCase()
  if (sl === 'complete')           return { bg: 'DCFCE7', textColor: '166534' }
  if (sl.includes('on track'))     return { bg: 'DBEAFE', textColor: '1E40AF' }
  if (sl.includes('at risk'))      return { bg: 'FEF9C3', textColor: '854D0E' }
  if (sl === 'delayed')            return { bg: 'FEE2E2', textColor: '991B1B' }
  return { bg: 'F1F5F9', textColor: '475569' }
}

function tblCell(text, { bg = 'FFFFFF', textColor = '1A1917', bold = false, sz = 1300 } = {}) {
  const b = 'E2E8F0'
  const borders = ['L','R','T','B'].map(d =>
    `<a:ln${d} w="9525" cmpd="sng"><a:solidFill><a:srgbClr val="${b}"/></a:solidFill></a:ln${d}>`
  ).join('')
  return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${para(run(String(text||''), sz, bold, textColor))}</a:txBody><a:tcPr>${borders}<a:solidFill><a:srgbClr val="${bg}"/></a:solidFill></a:tcPr></a:tc>`
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

// ── Slide layouts ─────────────────────────────────────────────────────────────
function titleSlide(title, date, color) {
  const hdr = 1828800
  return slideWrap(
    rect(2, 0, 0, W, hdr, color) +
    textBox(3, PAD, 457200, W - PAD*2, 914400, para(run(title, 4000, true, 'FFFFFF'))) +
    textBox(4, PAD, hdr + 274320, W - PAD*2, 457200, para(run(date, 1800, false, 'CCCCCC')))
  )
}

function contentSlide(title, bullets, color) {
  const bodyY = HDR + 228600
  const bodyH = H - bodyY - 548640
  const bParas = (bullets || []).map(b => para(run('•  ' + b, 1600, false, '1A1917'))).join('')
    || para(run('', 1600, false, '1A1917'))
  return slideWrap(
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    textBox(4, PAD, bodyY, W - PAD*2, bodyH, bParas)
  )
}

// Left accent strip + large summary text
function highlightSlide(title, text, color) {
  const bodyY = HDR + 274320
  const bodyH = H - bodyY - 548640
  const stripW = 27432
  const textX = PAD + stripW + 228600
  return slideWrap(
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    rect(4, PAD, bodyY, stripW, bodyH, hex6(color)) +
    textBox(5, textX, bodyY, W - textX - PAD, bodyH, para(run(text || '', 1900, false, '1A1917')))
  )
}

// Two equal columns with sub-headings
function twoColSlide(title, leftTitle, leftBullets, rightTitle, rightBullets, color) {
  const divX = Math.floor(W / 2) - 9000
  const colW = divX - PAD - 91440
  const midX = divX + 18000
  const bodyY = HDR + 228600
  const subH = 320000
  const listY = bodyY + subH + 91440
  const listH = H - listY - 548640
  const lPars = (leftBullets || []).map(b => para(run('•  ' + b, 1400, false, '1A1917'))).join('')
  const rPars = (rightBullets || []).map(b => para(run('•  ' + b, 1400, false, '1A1917'))).join('')
  return slideWrap(
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    rect(4, divX, bodyY, 18000, bodyY + listH + subH + 91440 - bodyY, 'E2E8F0') +
    textBox(5, PAD, bodyY, colW, subH, para(run(leftTitle || '', 1700, true, hex6(color)))) +
    textBox(6, PAD, listY, colW, listH, lPars) +
    textBox(7, midX, bodyY, colW, subH, para(run(rightTitle || '', 1700, true, hex6(color)))) +
    textBox(8, midX, listY, colW, listH, rPars)
  )
}

// Key-value table (no header — shaded keys column)
function overviewTableSlide(title, rows, color) {
  const tblY = HDR + 228600
  const tblW = W - PAD * 2
  const rowH = Math.min(530000, Math.floor((H - tblY - 548640) / Math.max(1, rows.length)))
  const tblH = rowH * rows.length
  const col1W = Math.floor(tblW * 0.28)
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
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    tblFrame(10, PAD, tblY, tblW, tblH, [col1W, tblW - col1W], tableRows)
  )
}

// Colored-header table with RAG cell per row
function ragTableSlide(title, risks, color) {
  const tblY = HDR + 228600
  const tblW = W - PAD * 2
  const hdrH = 500000
  const n = Math.max(1, (risks || []).length)
  const dataH = Math.floor((H - tblY - 548640 - hdrH) / n)
  const tblH = hdrH + dataH * n
  const cols = [
    Math.floor(tblW * 0.34), Math.floor(tblW * 0.08),
    Math.floor(tblW * 0.42), Math.floor(tblW * 0.16),
  ]
  const headerRow = {
    height: hdrH,
    cells: ['Risk / Issue', 'RAG', 'Mitigation', 'Owner'].map(h =>
      tblCell(h, { bg: hex6(color), textColor: 'FFFFFF', bold: true })
    ),
  }
  const dataRows = (risks || []).map(r => ({
    height: dataH,
    cells: [
      tblCell(r.text || r.risk || '', { bg: 'FFFFFF', sz: 1200 }),
      tblCell(r.rag || '', { ...ragFill(r.rag), bold: true, sz: 1200 }),
      tblCell(r.mitigation || '', { bg: 'FAFAFA', textColor: '475569', sz: 1200 }),
      tblCell(r.owner || '', { bg: 'FFFFFF', textColor: '475569', sz: 1200 }),
    ],
  }))
  return slideWrap(
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    tblFrame(10, PAD, tblY, tblW, tblH, cols, [headerRow, ...dataRows])
  )
}

// Milestone tracker table with status-colored cells
function milestoneTableSlide(title, items, color) {
  const tblY = HDR + 228600
  const tblW = W - PAD * 2
  const hdrH = 500000
  const n = Math.max(1, (items || []).length)
  const dataH = Math.floor((H - tblY - 548640 - hdrH) / n)
  const tblH = hdrH + dataH * n
  const cols = [Math.floor(tblW * 0.55), Math.floor(tblW * 0.20), Math.floor(tblW * 0.25)]
  const headerRow = {
    height: hdrH,
    cells: ['Milestone', 'Planned Date', 'Status'].map(h =>
      tblCell(h, { bg: hex6(color), textColor: 'FFFFFF', bold: true })
    ),
  }
  const dataRows = (items || []).map(m => ({
    height: dataH,
    cells: [
      tblCell(m.name || m.milestone || '', { bg: 'FFFFFF', sz: 1200 }),
      tblCell(m.date || m.plannedDate || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200 }),
      tblCell(m.status || '', { ...statusFill(m.status), bold: true, sz: 1200 }),
    ],
  }))
  return slideWrap(
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    tblFrame(10, PAD, tblY, tblW, tblH, cols, [headerRow, ...dataRows])
  )
}

// Decisions table
function decisionsTableSlide(title, decisions, color) {
  const tblY = HDR + 228600
  const tblW = W - PAD * 2
  const hdrH = 500000
  const n = Math.max(1, (decisions || []).length)
  const dataH = Math.floor((H - tblY - 548640 - hdrH) / n)
  const tblH = hdrH + dataH * n
  const cols = [Math.floor(tblW * 0.55), Math.floor(tblW * 0.25), Math.floor(tblW * 0.20)]
  const headerRow = {
    height: hdrH,
    cells: ['Decision Required', 'Owner', 'Due Date'].map(h =>
      tblCell(h, { bg: hex6(color), textColor: 'FFFFFF', bold: true })
    ),
  }
  const dataRows = (decisions || []).map(d => ({
    height: dataH,
    cells: [
      tblCell(d.text || d.decision || '', { bg: 'FFFFFF', sz: 1200 }),
      tblCell(d.owner || '', { bg: 'F8FAFC', textColor: '475569', sz: 1200 }),
      tblCell(d.due || d.dueDate || '', { bg: 'FFFFFF', textColor: '475569', sz: 1200 }),
    ],
  }))
  return slideWrap(
    rect(2, 0, 0, W, HDR, color) +
    textBox(3, PAD, 137160, W - PAD*2, HDR - 137160, para(run(title, 2600, true, 'FFFFFF'))) +
    tblFrame(10, PAD, tblY, tblW, tblH, cols, [headerRow, ...dataRows])
  )
}

// ─── PPTX package XML ─────────────────────────────────────────────────────────
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
<p:titleStyle><a:lvl1pPr><a:defRPr sz="4400" b="1"><a:solidFill><a:srgbClr val="${hex6(color)}"/></a:solidFill><a:latin typeface="Calibri"/></a:defRPr></a:lvl1pPr></p:titleStyle>
<p:bodyStyle><a:lvl1pPr><a:defRPr sz="2000"><a:latin typeface="Calibri"/></a:defRPr></a:lvl1pPr></p:bodyStyle>
<p:otherStyle><a:defPPr><a:defRPr><a:latin typeface="Calibri"/></a:defRPr></a:defPPr></p:otherStyle>
</p:txStyles></p:sldMaster>`
}

function themeXml(color) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Theme">
<a:themeElements>
<a:clrScheme name="Scheme">
<a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="1F3864"/></a:dk2><a:lt2><a:srgbClr val="F3F3F3"/></a:lt2>
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
<p:sldSz cx="${W}" cy="${H}" type="screen4x3"/>
<p:notesSz cx="${H}" cy="${W}"/>
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

// ─── Builder ──────────────────────────────────────────────────────────────────
async function buildPptxFromSlides(slideXmls, theme, deckTitle) {
  const color = theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB')
  const allSlides = [titleSlide(deckTitle, date, color), ...slideXmls]
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

// ─── Exports ──────────────────────────────────────────────────────────────────
export async function genKickoffDeck(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const d = await callClaudeJSON({
    ...opts,
    user: `Generate a project kick-off presentation. Use specific, professional language a consultant would write.
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
  "milestones": [{"name":"string","date":"DD/MM/YYYY","status":"On Track"} x5-6],
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
  return buildPptxFromSlides(slides, ctx.theme, `Kick-off — ${ctx.pname}`)
}

export async function genDeliveryReport(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB')
  const d = await callClaudeJSON({
    ...opts,
    user: `Generate a delivery status report presentation. Use specific, professional language.
Project: ${ctx.pname} | Client: ${ctx.cname} | DM: ${ctx.dm || 'TBC'} | Method: ${ctx.method}
Scope: ${ctx.scope}${ctx.sow ? `\n\nStatement of Work:\n${ctx.sow.slice(0,2500)}` : ''}
${ctx.instructions?.['delivery-report'] ? `\nCUSTOM INSTRUCTIONS: ${ctx.instructions['delivery-report']}` : ''}

Return ONLY this JSON (no markdown, no extra fields):
{
  "rag": "Green|Amber|Red",
  "summary": "2-3 sentence paragraph summarising delivery health",
  "statusRows": [["Budget","On Track"],["Timeline","On Track"],["Scope","Stable"],["Team","Fully resourced"],["Client satisfaction","High"]],
  "completed": ["string x5-6"],
  "upcoming": ["string x5-6"],
  "risks": [{"text":"string","rag":"Green|Amber|Red","mitigation":"string","owner":"string"} x4-5],
  "milestones": [{"name":"string","date":"DD/MM/YYYY","status":"Complete|On Track|At Risk|Delayed"} x5-6],
  "nextSteps": ["string x4-5"]
}`,
  })
  const statusRows = [
    ['Project', ctx.pname || ''],
    ['Client', ctx.cname || ''],
    ['Report Date', date],
    ['Overall RAG', d.rag || 'Green', d.rag],
    ...(d.statusRows || []).map(([k, v]) => [k, v]),
  ]
  const slides = [
    highlightSlide('Executive Summary', d.summary || '', color),
    overviewTableSlide('Project Status', statusRows, color),
    twoColSlide('Delivery Progress', 'Completed', d.completed || [], 'Upcoming', d.upcoming || [], color),
    ragTableSlide('Risks & Issues', d.risks || [], color),
    milestoneTableSlide('Milestones', d.milestones || [], color),
    contentSlide('Next Steps', d.nextSteps || [], color),
  ]
  return buildPptxFromSlides(slides, ctx.theme, `Delivery Report — ${ctx.pname}`)
}

export async function genPptxStatusReport(ctx, opts) {
  const color = ctx.theme?.primary || '#4F46E5'
  const date = new Date().toLocaleDateString('en-GB')
  const d = await callClaudeJSON({
    ...opts,
    user: `Generate a weekly project status report presentation. Use specific, professional language.
Project: ${ctx.pname} | Client: ${ctx.cname} | DM: ${ctx.dm || 'TBC'} | Method: ${ctx.method}
Scope: ${ctx.scope}${ctx.sow ? `\n\nStatement of Work:\n${ctx.sow.slice(0,2500)}` : ''}
${ctx.instructions?.['status-report'] ? `\nCUSTOM INSTRUCTIONS: ${ctx.instructions['status-report']}` : ''}

Return ONLY this JSON (no markdown, no extra fields):
{
  "rag": "Green|Amber|Red",
  "summary": "2-3 sentence paragraph on project health this week",
  "progress": ["string x6-8"],
  "planned": ["string x5-6"],
  "risks": [{"text":"string","rag":"Green|Amber|Red","mitigation":"string","owner":"string"} x4-5],
  "milestones": [{"name":"string","date":"DD/MM/YYYY","status":"Complete|On Track|At Risk|Delayed"} x5-6],
  "decisions": [{"text":"string","owner":"string","due":"DD/MM/YYYY"} x3]
}`,
  })
  const slides = [
    overviewTableSlide('Project Overview', [
      ['Project', ctx.pname || ''],
      ['Client', ctx.cname || ''],
      ['Report Date', date],
      ['Delivery Manager', ctx.dm || ''],
      ['Overall Status', d.rag || 'Green', d.rag],
      ['Reporting Period', `Week ending ${date}`],
    ], color),
    highlightSlide('Executive Summary', d.summary || '', color),
    twoColSlide('Progress & Planned Work',
      'Progress This Period', d.progress || [],
      'Planned Next Period', d.planned || [],
      color),
    ragTableSlide('Risks & Issues', d.risks || [], color),
    milestoneTableSlide('Milestone Tracker', d.milestones || [], color),
    decisionsTableSlide('Decisions Required', d.decisions || [], color),
  ]
  return buildPptxFromSlides(slides, ctx.theme, `Weekly Status Report — ${ctx.pname}`)
}
