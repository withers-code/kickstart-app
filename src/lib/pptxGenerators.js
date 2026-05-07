import JSZip from 'jszip'
import { callClaudeJSON } from './api.js'

// EMU constants (1 inch = 914400 EMU)
const W = 9144000   // slide width  (10 in)
const H = 6858000   // slide height (7.5 in)

function hex6(h) { return (h || '#4F46E5').replace('#', '').toUpperCase().padEnd(6, '0') }
function esc(s)   { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

// ─── XML primitives ────────────────────────────────────────────────────────────
function rPr(sz, bold, color) {
  return `<a:rPr lang="en-GB" sz="${sz}" b="${bold?1:0}" dirty="0"><a:solidFill><a:srgbClr val="${hex6(color)}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr>`
}
function run(text, sz, bold, color) { return `<a:r>${rPr(sz,bold,color)}<a:t>${esc(text)}</a:t></a:r>` }
function para(runs, align='l')      { return `<a:p><a:pPr algn="${align}"/>${runs}</a:p>` }
function txBody(paras)              { return `<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paras}</p:txBody>` }

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

// ─── Slide builders ────────────────────────────────────────────────────────────
function titleSlide(title, date, color) {
  const hdr = 1828800   // 2 in header
  const pad = 457200    // 0.5 in
  return slideWrap(
    rect(2, 0, 0, W, hdr, color) +
    textBox(3, pad, 457200, W - pad*2, 914400,
      para(run(title, 4000, true, 'FFFFFF'))) +
    textBox(4, pad, hdr + 274320, W - pad*2, 457200,
      para(run(date, 1800, false, 'CCCCCC')))
  )
}

function contentSlide(title, bullets, color) {
  const hdr = 685800    // 0.75 in header
  const pad = 457200    // 0.5 in
  const bodyY = hdr + 228600
  const bodyH = H - bodyY - 548640
  const bulletParas = (bullets || []).map(b =>
    para(run('•  ' + b, 1600, false, '1A1917'))
  ).join('') || para(run('', 1600, false, '1A1917'))

  return slideWrap(
    rect(2, 0, 0, W, hdr, color) +
    textBox(3, pad, 137160, W - pad*2, hdr - 137160,
      para(run(title, 2600, true, 'FFFFFF'))) +
    textBox(4, pad, bodyY, W - pad*2, bodyH, bulletParas)
  )
}

// ─── Package XML ──────────────────────────────────────────────────────────────
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
${overrides}
</Types>`
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
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             type="blank" preserve="1">
<p:cSld name="Blank"><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
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
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
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
  const ids = Array.from({length: n}, (_, i) =>
    `<p:sldId id="${256+i}" r:id="rId${i+2}"/>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                saveSubsetFonts="1">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${ids}</p:sldIdLst>
<p:sldSz cx="${W}" cy="${H}" type="screen4x3"/>
<p:notesSz cx="${H}" cy="${W}"/>
</p:presentation>`
}

function presentationRels(n) {
  const slides = Array.from({length: n}, (_, i) =>
    `<Relationship Id="rId${i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${slides}
</Relationships>`
}

// ─── Main builder ─────────────────────────────────────────────────────────────
async function buildPptx(slideData, theme, deckTitle) {
  const color = theme.primary
  const date = new Date().toLocaleDateString('en-GB')
  const allSlides = [
    titleSlide(deckTitle, date, color),
    ...(slideData || []).map(s => contentSlide(s.title, s.bulletPoints, color)),
  ]
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
  const data = await callClaudeJSON({
    ...opts,
    user: `Generate kick-off presentation slides for: Project: ${ctx.pname} | Client: ${ctx.cname} | Team: ${ctx.team} | Scope: ${ctx.scope}${ctx.instructions?.['kick-off-deck'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['kick-off-deck']}` : ''}${ctx.examples?.['kick-off-deck']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['kick-off-deck'].text.slice(0, 4000)}` : ''}
Return JSON: {slides:[{title:string,bulletPoints:[string]} x 8-10 slides]}`,
  })
  return buildPptx(data.slides || [], ctx.theme, `Kick-off — ${ctx.pname}`)
}

export async function genDeliveryReport(ctx, opts) {
  const data = await callClaudeJSON({
    ...opts,
    user: `Generate delivery status presentation slides for: Project: ${ctx.pname} | Client: ${ctx.cname} | Method: ${ctx.method} | Scope: ${ctx.scope}${ctx.instructions?.['delivery-report'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['delivery-report']}` : ''}${ctx.examples?.['delivery-report']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['delivery-report'].text.slice(0, 4000)}` : ''}
Return JSON: {slides:[{title:string,bulletPoints:[string]} x 8-12 slides]}`,
  })
  return buildPptx(data.slides || [], ctx.theme, `Delivery Report — ${ctx.pname}`)
}

export async function genPptxStatusReport(ctx, opts) {
  const date = new Date().toLocaleDateString('en-GB')
  const data = await callClaudeJSON({
    ...opts,
    user: `Generate a weekly status report presentation. Project: ${ctx.pname} | Client: ${ctx.cname} | DM: ${ctx.dm} | Scope: ${ctx.scope} | Team: ${ctx.team} | Method: ${ctx.method}${ctx.instructions?.['status-report'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['status-report']}` : ''}${ctx.examples?.['status-report']?.text ? `\n\nEXAMPLE — match this quality and format:\n${ctx.examples['status-report'].text.slice(0, 4000)}` : ''}
Return JSON: {slides:[
  {title:"Project Overview", bulletPoints:["Project: <name>","Client: <client>","Date: ${date}","Delivery Manager: <dm>","Overall Status: Green / Amber / Red","Reporting Period: Week ending ${date}"]},
  {title:"Executive Summary", bulletPoints:[3-4 concise bullet points summarising overall health and key message]},
  {title:"Progress This Period", bulletPoints:[6-8 specific completed items with owner or workstream prefix where relevant]},
  {title:"Planned Next Period", bulletPoints:[5-6 planned items for the coming week]},
  {title:"Risks & Issues", bulletPoints:["[Amber] <risk> — <mitigation> (Owner: <name>)", "[Red] ...", "[Green] ..." — 4-5 items using RAG prefix]},
  {title:"Milestones", bulletPoints:["✓ <milestone> — <date> — Complete", "→ <milestone> — <date> — On Track", "⚠ <milestone> — <date> — At Risk" — 5-6 items]},
  {title:"Decisions Required", bulletPoints:["<decision> | Owner: <name> | Due: <date>" — 3 items]}
]}`,
  })
  return buildPptx(data.slides || [], ctx.theme, `Weekly Status Report — ${ctx.pname}`)
}
