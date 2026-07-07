import PDFDocument from 'pdfkit'

function titleForTarget(targetType, record) {
  if (targetType === 'dashboard') return record?.name ?? 'Dashboard'
  if (targetType === 'snapshot') return `Snapshot ${record?.period ?? record?.id ?? ''}`.trim()
  if (targetType === 'report') return record?.name ?? 'Report'
  return 'Export'
}

function summarizeData(data) {
  if (!data || typeof data !== 'object') return []
  const lines = []
  const widgets = data.widgets ?? {}
  for (const [id, w] of Object.entries(widgets)) {
    if (w?.rows?.length) {
      lines.push(`Widget ${id}: ${w.rows.length} row(s)`)
      const sample = w.rows.slice(0, 3)
      lines.push(JSON.stringify(sample, null, 0).slice(0, 200))
    } else if (w?.error) {
      lines.push(`Widget ${id}: error — ${w.error}`)
    }
  }
  const indicators = data.indicators ?? {}
  for (const [id, iv] of Object.entries(indicators)) {
    lines.push(`Indicator ${id}: value=${iv?.value ?? '—'} period=${iv?.period ?? '—'}`)
  }
  return lines
}

export function buildExportContext(targetType, record) {
  const title = titleForTarget(targetType, record)
  const subtitle = new Date().toISOString()
  let sections = []

  if (targetType === 'dashboard') {
    sections = [
      `Description: ${record?.description ?? '—'}`,
      `Widgets: ${Object.keys(record?.widgets ?? {}).length}`,
    ]
  } else if (targetType === 'snapshot') {
    sections = summarizeData(record?.data)
  } else if (targetType === 'report') {
    sections = [
      `Period: ${record?.period ?? '—'}`,
      `Status: ${record?.status ?? 'draft'}`,
      `Blocks: ${Array.isArray(record?.blocks) ? record.blocks.length : 0}`,
    ]
    if (Array.isArray(record?.blocks)) {
      for (const block of record.blocks.slice(0, 20)) {
        sections.push(typeof block === 'object' ? JSON.stringify(block).slice(0, 120) : String(block))
      }
    }
  }

  return { title, subtitle, sections }
}

export async function renderPdf(context) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(20).text(context.title, { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#666').text(`Generated ${context.subtitle}`)
    doc.moveDown()
    doc.fillColor('#000').fontSize(12)
    for (const line of context.sections) {
      doc.text(line, { width: 500 })
      doc.moveDown(0.3)
    }
    doc.end()
  })
}

export async function renderCsv(context) {
  const rows = [['section', 'value'], ['title', context.title], ['generated', context.subtitle]]
  for (let i = 0; i < context.sections.length; i++) {
    rows.push([`line_${i + 1}`, context.sections[i]])
  }
  return Buffer.from(
    rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'),
    'utf8',
  )
}

export async function renderPptx(context) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  const slide = pptx.addSlide()
  slide.addText(context.title, { x: 0.5, y: 0.4, w: 9, h: 1, fontSize: 24, bold: true })
  slide.addText(`Generated ${context.subtitle}`, { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 12, color: '666666' })
  const body = context.sections.slice(0, 12).join('\n')
  slide.addText(body || 'No content', { x: 0.5, y: 1.8, w: 9, h: 4.5, fontSize: 14, valign: 'top' })
  const buf = await pptx.write({ outputType: 'nodebuffer' })
  return Buffer.from(buf)
}

export function mimeForFormat(format) {
  switch (format) {
    case 'pdf':
      return 'application/pdf'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    case 'csv':
      return 'text/csv'
    case 'png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

export function extForFormat(format) {
  if (format === 'png') return 'png'
  return format
}
