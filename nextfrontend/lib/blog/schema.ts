import { z } from 'zod'
import { POST_CATEGORIES } from '@/lib/blog/categories'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const postInputSchema = z.object({
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(160, 'El título no puede superar 160 caracteres'),
    slug: z
        .string()
        .trim()
        .toLowerCase()
        .max(180, 'El slug no puede superar 180 caracteres')
        .refine((value) => value === '' || SLUG_PATTERN.test(value), 'Slug inválido: usa minúsculas, números y guiones')
        .optional(),
    excerpt: z.string().trim().min(10, 'El resumen debe tener al menos 10 caracteres').max(320, 'El resumen no puede superar 320 caracteres'),
    content: z.string().trim().min(20, 'El contenido debe tener al menos 20 caracteres'),
    category: z.enum(POST_CATEGORIES),
    published: z.coerce.boolean(),
})

export type PostInput = z.infer<typeof postInputSchema>

export const setPublishedSchema = z.object({
    id: z.string().min(1),
    published: z.boolean(),
})

export const postIdSchema = z.object({
    id: z.string().min(1),
})

export function fieldErrorsFrom(error: z.ZodError<unknown>): Record<string, string[]> {
    const errors: Record<string, string[]> = {}
    for (const issue of error.issues) {
        const key = String(issue.path[0] ?? 'form')
        errors[key] = [...(errors[key] ?? []), issue.message]
    }
    return errors
}
