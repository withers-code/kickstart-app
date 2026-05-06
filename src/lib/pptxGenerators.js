import PptxGenJS from 'pptxgenjs'
import { callClaudeJSON } from './api.js'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#4F46E5')
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 79, g: 70, b: 229 }
}

async function fetchKickoffSlides(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate kick-off presentation slides for: Project: ${ctx.pname} | Client: ${ctx.cname} | Team: ${ctx.team} | Scope: ${ctx.scope}${ctx.instructions?.['kick-off-deck'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['kick-off-deck']}` : ''}
Return JSON: {slides:[{title:string,bulletPoints:[string],notes:string} x 8-10 slides]}`,
  })
}

async function fetchDeliverySlides(ctx, opts) {
  return callClaudeJSON({
    ...opts,
    user: `Generate delivery status presentation slides for: Project: ${ctx.pname} | Client: ${ctx.cname} | Method: ${ctx.method} | Tech: ${ctx.tech} | Scope: ${ctx.scope}${ctx.instructions?.['delivery-report'] ? `\n\nCUSTOM INSTRUCTIONS: ${ctx.instructions['delivery-report']}` : ''}
Return JSON: {slides:[{title:string,bulletPoints:[string],status:string,notes:string} x 8-12 slides]}`,
  })
}

function buildPptx(slides, theme, title) {
  const prs = new PptxGenJS()
  const primaryColor = hexToRgb(theme.primary)
  const textColor = { r: 26, g: 25, b: 23 }

  // Slide dimensions
  prs.defineLayout({ name: 'LAYOUT1', width: 10, height: 7.5 })

  // Title slide
  const titleSlide = prs.addSlide('LAYOUT1')
  titleSlide.background = { color: 'FFFFFF' }
  titleSlide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 2,
    fill: { color: primaryColor },
  })
  titleSlide.addText(title, {
    x: 0.5, y: 0.5, w: 9, h: 1.5,
    fontSize: 44, bold: true, color: 'FFFFFF',
    align: 'left', valign: 'middle',
    fontFace: 'Calibri',
  })
  titleSlide.addText(`${new Date().toLocaleDateString('en-GB')} | ${title}`, {
    x: 0.5, y: 6, w: 9, h: 0.4,
    fontSize: 10, color: '999999', align: 'right', fontFace: 'Calibri',
  })

  // Content slides
  (slides || []).forEach((slide) => {
    const contentSlide = prs.addSlide('LAYOUT1')
    contentSlide.background = { color: 'FFFFFF' }

    // Header bar
    contentSlide.addShape(prs.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.8,
      fill: { color: primaryColor },
    })

    // Title
    contentSlide.addText(slide.title || '', {
      x: 0.5, y: 0.15, w: 9, h: 0.5,
      fontSize: 28, bold: true, color: 'FFFFFF',
      align: 'left', valign: 'middle', fontFace: 'Calibri',
    })

    // Bullet points
    let yPos = 1.2
    const bulletPoints = slide.bulletPoints || []
    bulletPoints.forEach((point) => {
      contentSlide.addText(`• ${point}`, {
        x: 0.7, y: yPos, w: 8.6, h: 0.4,
        fontSize: 14, color: textColor,
        align: 'left', fontFace: 'Calibri',
      })
      yPos += 0.45
    })

    // Footer
    contentSlide.addText(`${new Date().toLocaleDateString('en-GB')} | ${title}`, {
      x: 0.5, y: 7, w: 9, h: 0.3,
      fontSize: 9, color: '999999', align: 'right', fontFace: 'Calibri',
    })
  })

  return prs.write({ outputType: 'arraybuffer' })
}

export async function genKickoffDeck(ctx, opts) {
  const data = await fetchKickoffSlides(ctx, opts)
  const buffer = await buildPptx(data.slides || [], ctx.theme, `Kick-off — ${ctx.pname}`)
  return buffer
}

export async function genDeliveryReport(ctx, opts) {
  const data = await fetchDeliverySlides(ctx, opts)
  const buffer = await buildPptx(data.slides || [], ctx.theme, `Delivery Report — ${ctx.pname}`)
  return buffer
}
