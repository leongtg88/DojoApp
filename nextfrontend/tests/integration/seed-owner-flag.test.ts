import { execSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const { db, resetDb } = await import('./db')

beforeAll(async () => {
  await resetDb()
  execSync('pnpm exec tsx prisma/seed.ts', {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      SEED_OWNER_PASSWORD: 'Audit-Owner-2026!',
      SEED_ADMIN_PASSWORD: 'Audit-Admin-2026!',
      SEED_INSTRUCTOR_PASSWORD: 'Audit-Instructor-2026!',
      SEED_STUDENT_PASSWORD: 'Audit-Student-2026!',
      SEED_RESET: '0',
    },
    stdio: 'pipe',
    timeout: 120_000,
  })
}, 180_000)

afterAll(resetDb)

describe('UX-B5.1 · seed del owner', () => {
  it('marca solo al expediente del sensei', async () => {
    const owner = await db.user.findUnique({
      where: { email: 'sensei@toseigusoku.com' },
      select: { id: true, studentProfile: { select: { id: true, excludeFromPendingCounts: true } } },
    })
    const student = await db.user.findUnique({
      where: { email: 'alumno@test.com' },
      select: { studentProfile: { select: { excludeFromPendingCounts: true } } },
    })
    const marked = await db.student.findMany({
      where: { excludeFromPendingCounts: true },
      select: { userId: true },
    })

    expect(owner?.studentProfile?.excludeFromPendingCounts).toBe(true)
    expect(student?.studentProfile?.excludeFromPendingCounts).toBe(false)
    expect(marked).toHaveLength(1)
    expect(marked[0]?.userId).toBe(owner?.id)
  })
})
