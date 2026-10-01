'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { recordAudit } from '@/lib/security/audit'
import { fieldErrorsFrom, postIdSchema, postInputSchema, setPublishedSchema } from '@/lib/blog/schema'
import { resolveUniqueSlug, slugify } from '@/lib/blog/slug'
import { sniffMimeType } from '@/lib/file-validation'
import {
    BLOG_IMAGE_MAX_SIZE,
    BLOG_IMAGE_MIME_TYPES,
    deleteBlogImages,
    getBlogImagePublicUrl,
    sanitizeStorageName,
    uploadBlogImage,
} from '@/lib/blog-storage'

export interface BlogActionState {
    error?: string
    fieldErrors?: Record<string, string[]>
}

interface ActionResult {
    ok: boolean
    error?: string
}

async function requireAdmin(): Promise<string | null> {
    const session = await auth()
    if (!session?.user?.id) return null
    const scope = await getAdminScope(session.user.id)
    if (!scope) return null
    return session.user.id
}

function revalidateBlog(slug?: string) {
    revalidatePath('/blog')
    if (slug) revalidatePath(`/blog/${slug}`)
    revalidatePath('/dashboard/admin/blog')
}

// Devuelve la imagen enviada, `null` si no hay archivo, o `'invalid'` si no
// cumple tamaño/formato. El tipo real se verifica por firma de bytes (no solo
// por el Content-Type declarado por el cliente).
async function readCoverFile(formData: FormData): Promise<File | null | 'invalid'> {
    const file = formData.get('coverImage')
    if (!(file instanceof File) || file.size === 0) return null
    if (file.size > BLOG_IMAGE_MAX_SIZE || !BLOG_IMAGE_MIME_TYPES.has(file.type)) return 'invalid'
    const sniffed = sniffMimeType(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
    if (!BLOG_IMAGE_MIME_TYPES.has(sniffed)) return 'invalid'
    return file
}

async function storeCover(file: File): Promise<{ url: string; key: string }> {
    const key = `blog/${crypto.randomUUID()}-${sanitizeStorageName(file.name)}`
    await uploadBlogImage(key, file)
    return { url: getBlogImagePublicUrl(key), key }
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
    return resolveUniqueSlug(base, async (slug) => {
        const existing = await db.post.findUnique({ where: { slug }, select: { id: true } })
        return Boolean(existing) && existing?.id !== excludeId
    })
}

export async function createPost(_prev: BlogActionState, formData: FormData): Promise<BlogActionState> {
    const adminId = await requireAdmin()
    if (!adminId) return { error: 'No autorizado' }

    const parsed = postInputSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

    const coverFile = await readCoverFile(formData)
    if (coverFile === 'invalid') return { fieldErrors: { coverImage: ['Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB'] } }

    let cover: { url: string; key: string } | null = null
    if (coverFile) {
        try {
            cover = await storeCover(coverFile)
        } catch {
            return { error: 'No fue posible subir la imagen de portada. Inténtalo nuevamente.' }
        }
    }

    const data = parsed.data
    const slug = await uniqueSlug(data.slug?.trim() ? data.slug.trim() : slugify(data.title))

    try {
        await db.post.create({
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt,
                content: data.content,
                category: data.category,
                published: data.published,
                publishedAt: data.published ? new Date() : null,
                coverImageUrl: cover?.url ?? null,
                coverImageKey: cover?.key ?? null,
                authorId: adminId,
            },
        })
    } catch (error) {
        if (cover?.key) await deleteBlogImages([cover.key]).catch(() => {})
        console.error('[blog] Error creando post:', error)
        return { error: 'No fue posible guardar el artículo. Inténtalo nuevamente.' }
    }

    revalidateBlog(slug)
    redirect('/dashboard/admin/blog')
}

export async function updatePost(_prev: BlogActionState, formData: FormData): Promise<BlogActionState> {
    const adminId = await requireAdmin()
    if (!adminId) return { error: 'No autorizado' }

    const id = formData.get('id')
    if (typeof id !== 'string' || !id) return { error: 'Artículo no especificado' }

    const existing = await db.post.findUnique({ where: { id }, select: { id: true, slug: true, coverImageKey: true, publishedAt: true } })
    if (!existing) return { error: 'Artículo no encontrado' }

    const parsed = postInputSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

    const coverFile = await readCoverFile(formData)
    if (coverFile === 'invalid') return { fieldErrors: { coverImage: ['Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB'] } }

    const removeCover = formData.get('removeCoverImage') === 'on'
    const data = parsed.data

    let newCoverKey: string | null = existing.coverImageKey
    let newCoverUrl: string | null | undefined

    if (removeCover) {
        newCoverKey = null
        newCoverUrl = null
    } else if (coverFile) {
        try {
            const stored = await storeCover(coverFile)
            newCoverKey = stored.key
            newCoverUrl = stored.url
        } catch {
            return { error: 'No fue posible subir la imagen de portada. Inténtalo nuevamente.' }
        }
    }

    const desiredSlug = data.slug?.trim() ? data.slug.trim() : slugify(data.title)
    const slug = desiredSlug === existing.slug ? existing.slug : await uniqueSlug(desiredSlug, existing.id)

    try {
        await db.post.update({
            where: { id: existing.id },
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt,
                content: data.content,
                category: data.category,
                published: data.published,
                publishedAt: data.published ? existing.publishedAt ?? new Date() : existing.publishedAt,
                ...(newCoverUrl !== undefined ? { coverImageUrl: newCoverUrl } : {}),
                coverImageKey: newCoverKey,
            },
        })
    } catch (error) {
        console.error('[blog] Error actualizando post:', error)
        return { error: 'No fue posible actualizar el artículo. Inténtalo nuevamente.' }
    }

    // Limpieza de la imagen anterior si fue reemplazada o eliminada.
    if (existing.coverImageKey && existing.coverImageKey !== newCoverKey) {
        await deleteBlogImages([existing.coverImageKey]).catch(() => {})
    }

    revalidateBlog(slug)
    redirect('/dashboard/admin/blog')
}

export async function setPostPublished(input: { id: string; published: boolean }): Promise<ActionResult> {
    const adminId = await requireAdmin()
    if (!adminId) return { ok: false, error: 'No autorizado' }

    const parsed = setPublishedSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Datos no válidos' }

    const existing = await db.post.findUnique({ where: { id: parsed.data.id }, select: { slug: true, publishedAt: true } })
    if (!existing) return { ok: false, error: 'Artículo no encontrado' }

    try {
        await db.post.update({
            where: { id: parsed.data.id },
            data: {
                published: parsed.data.published,
                publishedAt: parsed.data.published ? existing.publishedAt ?? new Date() : existing.publishedAt,
            },
        })
    } catch (error) {
        console.error('[blog] Error publicando post:', error)
        return { ok: false, error: 'No fue posible actualizar el estado.' }
    }

    await recordAudit({ actorId: adminId, action: parsed.data.published ? 'blog.post.publish' : 'blog.post.unpublish', targetType: 'Post', targetId: parsed.data.id })
    revalidateBlog(existing.slug)
    return { ok: true }
}

export async function deletePost(input: { id: string }): Promise<ActionResult> {
    const adminId = await requireAdmin()
    if (!adminId) return { ok: false, error: 'No autorizado' }

    const parsed = postIdSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Datos no válidos' }

    const existing = await db.post.findUnique({ where: { id: parsed.data.id }, select: { slug: true, coverImageKey: true } })
    if (!existing) return { ok: false, error: 'Artículo no encontrado' }

    try {
        await db.post.delete({ where: { id: parsed.data.id } })
    } catch (error) {
        console.error('[blog] Error eliminando post:', error)
        return { ok: false, error: 'No fue posible eliminar el artículo.' }
    }

    if (existing.coverImageKey) await deleteBlogImages([existing.coverImageKey]).catch(() => {})
    await recordAudit({ actorId: adminId, action: 'blog.post.delete', targetType: 'Post', targetId: parsed.data.id })

    revalidateBlog(existing.slug)
    return { ok: true }
}
