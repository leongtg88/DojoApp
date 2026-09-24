import { readFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas } from '@napi-rs/canvas'

// Detector DEFINITIVO de subrayados: render a scale 4, corridas oscuras por fila,
// excluyendo bordes verticales (x<3pt o x>592pt). Uso: node scripts/final-lines.mjs <pdf>
const [, , file] = process.argv
const scale = 4
const minLen = 22
const border = 3 * scale

const data = new Uint8Array(readFileSync(file))
const pdf = await getDocument({ data, isEvalSupported: false }).promise
const page = await pdf.getPage(1)
const vp = page.getViewport({ scale })
const canvas = createCanvas(vp.width, vp.height)
const ctx = canvas.getContext('2d')
await page.render({ canvasContext: ctx, viewport: vp }).promise
const img = ctx.getImageData(0, 0, vp.width, vp.height)
const px = img.data

const rowRuns = (y) => {
  const out = []
  let s = -1
  for (let x = border; x < vp.width - border; x++) {
    const i = (y * vp.width + x) * 4
    const dark = px[i] < 150 && px[i + 1] < 150 && px[i + 2] < 150
    if (dark && s < 0) s = x
    if (!dark && s >= 0) {
      out.push([s, x - 1])
      s = -1
    }
  }
  if (s >= 0) out.push([s, vp.width - border])
  return out.filter(([a, b]) => b - a >= minLen * scale)
}

const clusters = []
let cur = null
for (let y = 0; y < vp.height; y++) {
  const runs = rowRuns(y)
  if (runs.length) {
    if (cur && y - cur.lastY <= 4) cur.rows.push({ y, runs })
    else {
      cur = { rows: [{ y, runs }], lastY: y }
      clusters.push(cur)
    }
  }
}

console.log('=== Subrayados definitivos (pt, top-left) ===')
for (const c of clusters) {
  const ys = c.rows.map((r) => r.y)
  let minX = Infinity
  let maxX = -Infinity
  for (const r of c.rows) for (const [a, b] of r.runs) {
    if (a < minX) minX = a
    if (b > maxX) maxX = b
  }
  const y = (Math.min(...ys) + Math.max(...ys)) / 2 / scale
  console.log(`y=${y.toFixed(1)}  x=${(minX / scale).toFixed(1)}→${(maxX / scale).toFixed(1)}  (${((maxX - minX) / scale).toFixed(0)}pt, ${c.rows.length} filas)`)
}