import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// Las server actions del blog usan APIs de Next fuera de un request real.
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('next/navigation', () => ({ redirect: () => {} }))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { createSchool, createUser } = await import('./fixtures')

const blog = await import('@/lib/blog/actions')
const blogQueries = await import('@/lib/blog/queries')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

function postForm(overrides: Record<string, string> = {}) {
  const form = new FormData()
  form.set('title', 'Mi Primer Artículo')
  form.set('excerpt', 'Un resumen suficientemente largo para el listado')
  form.set('content', 'Contenido del artículo con más de veinte caracteres para pasar la validación.')
  form.set('category', 'FILOSOFIA')
  form.set('published', 'on')
  for (const [key, value] of Object.entries(overrides)) form.set(key, value)
  return form
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 7 · F7-06 — Blog: crear/editar, publicar/despublicar y borrar.
describe('F7-06 · blog', () => {
  it('crea un artículo con slug generado del título', async () => {
    const school = await createSchool()
    const admin = await loginAsAdmin(school.id)

    await blog.createPost({}, postForm())

    const post = await db.post.findFirstOrThrow()
    expect(post.slug).toBe('mi-primer-articulo')
    expect(post.published).toBe(true)
    expect(post.publishedAt).not.toBeNull()
    expect(post.authorId).toBe(admin.id)
  })

  it('genera un slug único ante títulos repetidos', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)

    await blog.createPost({}, postForm())
    await blog.createPost({}, postForm())

    const slugs = (await db.post.findMany({ select: { slug: true } })).map((post) => post.slug).sort()
    expect(slugs).toEqual(['mi-primer-articulo', 'mi-primer-articulo-2'])
  })

  it('publica y despublica un artículo', async () => {
    const school = await createSchool()
    const admin = await loginAsAdmin(school.id)
    const post = await db.post.create({
      data: {
        title: 'Borrador',
        slug: 'borrador',
        excerpt: 'resumen',
        content: 'contenido de prueba',
        category: 'EDUCATIVO',
        published: false,
        authorId: admin.id,
      },
      select: { id: true },
    })

    const published = await blog.setPostPublished({ id: post.id, published: true })
    expect(published.ok).toBe(true)
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).published).toBe(true)

    const unpublished = await blog.setPostPublished({ id: post.id, published: false })
    expect(unpublished.ok).toBe(true)
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).published).toBe(false)
  })

  it('elimina un artículo', async () => {
    const school = await createSchool()
    const admin = await loginAsAdmin(school.id)
    const post = await db.post.create({
      data: {
        title: 'A borrar',
        slug: 'a-borrar',
        excerpt: 'resumen',
        content: 'contenido de prueba',
        category: 'EDUCATIVO',
        published: true,
        authorId: admin.id,
      },
      select: { id: true },
    })

    const result = await blog.deletePost({ id: post.id })
    expect(result.ok).toBe(true)
    expect(await db.post.count()).toBe(0)
  })

  it('solo expone artículos publicados en las consultas públicas', async () => {
    const school = await createSchool()
    const admin = await loginAsAdmin(school.id)
    const published = await db.post.create({
      data: {
        title: 'Publicado',
        slug: 'publicado',
        excerpt: 'resumen',
        content: 'contenido de prueba',
        category: 'FILOSOFIA',
        published: true,
        publishedAt: new Date(),
        authorId: admin.id,
      },
      select: { id: true },
    })
    await db.post.create({
      data: {
        title: 'Borrador',
        slug: 'borrador-oculto',
        excerpt: 'resumen',
        content: 'contenido de prueba',
        category: 'FILOSOFIA',
        published: false,
        authorId: admin.id,
      },
    })

    const { posts } = await blogQueries.getPublishedPosts({})
    expect(posts.map((post) => post.id)).toEqual([published.id])
    expect(await blogQueries.getPublishedPostBySlug('borrador-oculto')).toBeNull()
  })
})
