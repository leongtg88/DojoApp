import { chromium } from '@playwright/test'
import fs from 'node:fs'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const fixtures = JSON.parse(fs.readFileSync('audit/reports/fixtures.json', 'utf8'))
const browser = await chromium.launch()

async function probe(label, state, path) {
  const context = await browser.newContext({ baseURL, storageState: state })
  const page = await context.newPage()
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const body = await page.locator('body').innerText().catch(() => '')
  console.log(JSON.stringify({
    label,
    status: res?.status(),
    finalUrl: page.url(),
    h1: await page.locator('h1').allTextContents(),
    hasOwnerName: body.includes('Sensei Tosei Gusoku'),
    bodyHead: body.slice(0, 160),
  }, null, 2))
  await context.close()
}

await probe('instructor->student', 'audit/.auth/new-instructor.json', '/dashboard/estudiante')
await probe('instructor->clases', 'audit/.auth/new-instructor.json', '/estudiante/clases')
await probe('student->admin', 'audit/.auth/new-student.json', '/dashboard/admin')
await probe('guardian->foreign-inicio', 'audit/.auth/new-guardian.json', `/dashboard/estudiante?estudiante=${fixtures.ownerStudentId}`)
await probe('guardian->foreign-clases', 'audit/.auth/new-guardian.json', `/dashboard/estudiante/clases?estudiante=${fixtures.ownerStudentId}`)
await probe('student->foreign', 'audit/.auth/new-student.json', `/dashboard/estudiante?estudiante=${fixtures.ownerStudentId}`)

await browser.close()
