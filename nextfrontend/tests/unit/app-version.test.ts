import { afterEach, describe, expect, it } from 'vitest'
import { GET } from '@/app/api/app-version/route'

const VARS = ['NEXT_DEPLOYMENT_ID', 'VERCEL_DEPLOYMENT_ID', 'VERCEL_GIT_COMMIT_SHA'] as const

afterEach(() => {
  for (const name of VARS) delete process.env[name]
})

describe('app-version', () => {
  it('devuelve el deployment id y sin caché', async () => {
    process.env.NEXT_DEPLOYMENT_ID = 'dpl-123'
    const res = GET()
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect((await res.json()) as { version: string }).toEqual({ version: 'dpl-123' })
  })

  it('cae a VERCEL_GIT_COMMIT_SHA y a null', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'sha-abc'
    expect((await GET().json()) as { version: string }).toEqual({ version: 'sha-abc' })

    delete process.env.VERCEL_GIT_COMMIT_SHA
    expect((await GET().json()) as { version: string | null }).toEqual({ version: null })
  })
})
