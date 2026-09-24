import { readFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas } from '@napi-rs/canvas'

// Render directo CORRECTO: cada carácter = colStep px = colStep/scale pt.
// Uso: node scripts/direct.mjs <pdf> x0 x1 y0 y1 colStep rowStep
const [, , file, x0a, x1a, y0a, y1a, colArg, rowArg] = process.argv
const scale = 4
const x0pt = Number(x0a)
const x1pt = Number(x1a)
const y0pt = Number(y0a)
const y1pt = Number(y1a)
const colStep = Number(colArg || 2)
const rowStep = Number(rowArg || 2)

const data = new Uint8Array(readFileSync(file))
const pdf = await getDocument({ data, isEvalSupported: false }).promise
const page = await pdf.getPage(1)
const vp = page.getViewport({ scale })
const canvas = createCanvas(vp.width, vp.height)
const ctx = canvas.getContext('2d')
await page.render({ canvasContext: ctx, viewport: vp }).promise
const img = ctx.getImageData(0, 0, vp.width, vp.height)
const px = img.data

console.log(`=== x${x0pt}-${x1pt} y${y0pt}-${y1pt} (1 char = ${(colStep / scale).toFixed(2)}pt) ===`)
for (let yPx = Math.round(y0pt * scale); yPx < Math.round(y1pt * scale); yPx += rowStep) {
  let row = ''
  for (let xPx = Math.round(x0pt * scale); xPx < Math.round(x1pt * scale); xPx += colStep) {
    const i = (yPx * vp.width + xPx) * 4
    const dark = px[i] < 150 && px[i + 1] < 150 && px[i + 2] < 150
    const mid = px[i] < 225 && px[i + 1] < 225 && px[i + 2] < 225
    row += dark ? '#' : mid ? '+' : '.'
  }
  if (/[#+]/.test(row)) {
    const yPt = (yPx / scale).toFixed(1)
    const xOffset = (Math.round(x0pt * scale) / scale).toFixed(1)
    console.log(`y=${yPt.padStart(6)} [x${xOffset}+] ${row}`)
  }
}