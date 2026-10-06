'use client'

import { useActionState, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, ImagePlus, Loader2, Pencil, Save, X } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createPost, updatePost, type BlogActionState } from '@/lib/blog/actions'
import { POST_CATEGORIES, POST_CATEGORY_LABELS } from '@/lib/blog/categories'
import type { PostFormValues } from '@/types/blog'

interface PostFormProps {
    mode: 'create' | 'edit'
    initial?: PostFormValues
}

const INITIAL_STATE: BlogActionState = {}

export function PostForm({ mode, initial }: PostFormProps) {
    const action = mode === 'edit' ? updatePost : createPost
    const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)

    const [content, setContent] = useState(initial?.content ?? '')
    const [tab, setTab] = useState<'write' | 'preview'>('write')
    const [coverPreview, setCoverPreview] = useState<string | null>(initial?.coverImageUrl ?? null)
    const [removeCover, setRemoveCover] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fieldErrors = state.fieldErrors ?? {}

    function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return
        setRemoveCover(false)
        setCoverPreview(URL.createObjectURL(file))
    }

    function clearCover() {
        setCoverPreview(null)
        setRemoveCover(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <form action={formAction} className="space-y-6">
            {initial?.id && <input name="id" type="hidden" value={initial.id} />}
            {removeCover && <input name="removeCoverImage" type="hidden" value="on" />}

            {state.error && <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-danger-text">{state.error}</p>}

            <div className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Contenido</p>
                <h2 className="mt-1 font-display text-lg font-bold text-ink">{mode === 'edit' ? 'Editar artículo' : 'Nuevo artículo'}</h2>

                <div className="mt-4 grid gap-4">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="title">
                        Título
                        <input
                            className="w-full min-w-0 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                            defaultValue={initial?.title}
                            id="title"
                            maxLength={160}
                            name="title"
                            placeholder="Título del artículo"
                            required
                        />
                        {fieldErrors.title && <span className="text-xs font-medium text-danger-text">{fieldErrors.title[0]}</span>}
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="slug">
                        Slug (URL)
                        <input
                            className="w-full min-w-0 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 font-mono text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                            defaultValue={initial?.slug}
                            id="slug"
                            maxLength={180}
                            name="slug"
                            placeholder="se-genera-del-titulo-si-lo-dejas-vacio"
                        />
                        <span className="text-xs font-normal text-ink-4">Solo minúsculas, números y guiones. Si lo dejas vacío se genera del título.</span>
                        {fieldErrors.slug && <span className="text-xs font-medium text-danger-text">{fieldErrors.slug[0]}</span>}
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="excerpt">
                        Resumen
                        <textarea
                            className="w-full min-w-0 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                            defaultValue={initial?.excerpt}
                            id="excerpt"
                            maxLength={320}
                            name="excerpt"
                            placeholder="Resumen corto que aparece en el listado"
                            required
                            rows={2}
                        />
                        {fieldErrors.excerpt && <span className="text-xs font-medium text-danger-text">{fieldErrors.excerpt[0]}</span>}
                    </label>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-ink">Contenido (Markdown)</span>
                            <div className="inline-flex rounded-md border border-edge-strong bg-surface-1 p-0.5 text-xs font-bold">
                                <button
                                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 transition-colors ${tab === 'write' ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`}
                                    onClick={() => setTab('write')}
                                    type="button"
                                >
                                    <Pencil aria-hidden="true" className="size-3.5" />Escribir
                                </button>
                                <button
                                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 transition-colors ${tab === 'preview' ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`}
                                    onClick={() => setTab('preview')}
                                    type="button"
                                >
                                    <Eye aria-hidden="true" className="size-3.5" />Vista previa
                                </button>
                            </div>
                        </div>

                        {tab === 'write' ? (
                            <textarea
                                className="min-h-96 w-full min-w-0 rounded-md border border-edge-strong bg-surface-1 px-4 py-3 font-mono text-xs font-normal leading-relaxed text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                                id="content"
                                onChange={(event) => setContent(event.target.value)}
                                placeholder={'# Título\n\nEscribe el artículo en **Markdown**.'}
                                value={content}
                            />
                        ) : (
                            <div className="min-h-96 rounded-md border border-edge-strong bg-surface-1 px-5 py-4">
                                {content.trim() ? (
                                    <div className="blog-prose text-ink">
                                        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                                    </div>
                                ) : (
                                    <p className="text-sm text-ink-4">Nada que previsualizar todavía.</p>
                                )}
                            </div>
                        )}
                        <textarea className="hidden" name="content" readOnly value={content} />
                        {fieldErrors.content && <span className="text-xs font-medium text-danger-text">{fieldErrors.content[0]}</span>}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Publicación</p>
                <h2 className="mt-1 font-display text-lg font-bold text-ink">Categoría y portada</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="category">
                        Categoría
                        <select
                            className="w-full min-w-0 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none focus:border-cyan-500"
                            defaultValue={initial?.category ?? 'FILOSOFIA'}
                            id="category"
                            name="category"
                        >
                            {POST_CATEGORIES.map((category) => (
                                <option key={category} value={category}>{POST_CATEGORY_LABELS[category]}</option>
                            ))}
                        </select>
                        {fieldErrors.category && <span className="text-xs font-medium text-danger-text">{fieldErrors.category[0]}</span>}
                    </label>

                    <label className="flex items-center gap-3 self-end rounded-md border border-edge-strong bg-surface-1 px-3 py-2.5 text-sm font-semibold text-ink" htmlFor="published">
                        <input
                            className="size-4 accent-cyan-500"
                            defaultChecked={initial?.published ?? false}
                            id="published"
                            name="published"
                            type="checkbox"
                        />
                        Publicar ahora
                    </label>
                </div>

                <div className="mt-4">
                    <span className="text-sm font-semibold text-ink">Imagen de portada</span>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-edge-strong bg-surface-1">
                            {coverPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="Vista previa de la portada" className="size-full object-cover" src={coverPreview} />
                            ) : (
                                <div className="flex size-full flex-col items-center justify-center gap-2 text-ink-4">
                                    <ImagePlus aria-hidden="true" className="size-6" />
                                    <span className="text-xs">Sin portada</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                accept="image/jpeg,image/png,image/webp"
                                className="block w-full text-xs text-ink-3 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0d1117] hover:file:bg-cyan-400"
                                id="coverImage"
                                name="coverImage"
                                onChange={handleCoverChange}
                                ref={fileInputRef}
                                type="file"
                            />
                            <span className="text-xs text-ink-4">JPG, PNG o WEBP · máximo 5 MB.</span>
                            {coverPreview && (
                                <button className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-danger-text hover:underline" onClick={clearCover} type="button">
                                    <X aria-hidden="true" className="size-3.5" />Quitar portada
                                </button>
                            )}
                            {fieldErrors.coverImage && <span className="text-xs font-medium text-danger-text">{fieldErrors.coverImage[0]}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60"
                    disabled={isPending}
                    type="submit"
                >
                    {isPending ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
                    {mode === 'edit' ? 'Guardar cambios' : 'Crear artículo'}
                </button>
                <Link className="rounded-md border border-edge-strong px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-3" href="/dashboard/admin/blog">
                    Cancelar
                </Link>
            </div>
        </form>
    )
}
