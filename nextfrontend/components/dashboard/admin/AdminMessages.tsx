'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, MessageCircle, RefreshCw, Send, ShieldCheck, ShieldOff } from 'lucide-react'
import type { AdminWhatsAppConversation, AdminWhatsAppThread } from '@/types/dashboard'

interface AdminMessagesProps {
  conversations: AdminWhatsAppConversation[]
  initialThread: AdminWhatsAppThread | null
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-DO', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function AdminMessages({ conversations, initialThread }: AdminMessagesProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(initialThread?.id ?? null)
  const [thread, setThread] = useState<AdminWhatsAppThread | null>(initialThread)
  const [loadingThread, setLoadingThread] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadThread(contactId: string) {
    setLoadingThread(true)
    setError(null)
    try {
      const response = await fetch(`/api/dashboard/admin/whatsapp/messages?contactId=${encodeURIComponent(contactId)}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error ?? 'No se pudo cargar la conversación.')
        setThread(null)
        return
      }
      const data = (await response.json()) as { thread: AdminWhatsAppThread }
      setThread(data.thread)
    } finally {
      setLoadingThread(false)
    }
  }

  function selectConversation(contactId: string) {
    if (contactId === selectedId) return
    setSelectedId(contactId)
    setReply('')
    void loadThread(contactId)
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = reply.trim()
    if (!selectedId || !body) return

    setSending(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contactId: selectedId, body }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo enviar el mensaje.')
        return
      }
      setReply('')
      await loadThread(selectedId)
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  const canReply = Boolean(thread?.withinServiceWindow) && !sending

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Administración</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Mensajes de WhatsApp</h1>
          <p className="mt-2 max-w-xl text-xs text-ink-3">
            Conversaciones recibidas por la WhatsApp Cloud API. Solo puedes responder texto libre dentro de las
            24 horas posteriores al último mensaje del contacto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="mt-6 rounded-lg border border-edge bg-surface-2 px-4 py-6 text-xs text-ink-3">
          Todavía no hay conversaciones registradas.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <section className="max-h-[38rem] overflow-y-auto rounded-lg border border-edge bg-surface-2">
            {conversations.map((conversation) => {
              const active = conversation.id === selectedId
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`flex w-full flex-col gap-1 border-b border-edge px-4 py-3 text-left transition-colors last:border-b-0 ${
                    active ? 'bg-surface-3' : 'hover:bg-surface-1'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-display text-sm font-bold text-ink">
                      {conversation.userName ?? conversation.phone}
                    </span>
                    {conversation.withinServiceWindow && (
                      <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-ok-text">
                        24h
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs text-ink-3">{conversation.phone}</span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-ink-4">
                      {conversation.lastDirection === 'OUTBOUND' && <span className="text-ink-3">Tú: </span>}
                      {conversation.lastMessage ?? 'Sin mensajes'}
                    </span>
                    {conversation.optIn ? (
                      <ShieldCheck className="size-3.5 shrink-0 text-ok-text" aria-label="Opt-in activo" />
                    ) : (
                      <ShieldOff className="size-3.5 shrink-0 text-ink-4" aria-label="Sin opt-in" />
                    )}
                  </span>
                </button>
              )
            })}
          </section>

          <section className="flex min-h-[38rem] flex-col rounded-lg border border-edge bg-surface-2">
            {!selectedId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-ink-4">
                <MessageCircle className="size-8" aria-hidden="true" />
                <p className="text-xs">Selecciona una conversación.</p>
              </div>
            ) : (
              <>
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-3">
                  <div>
                    <h2 className="font-display text-sm font-bold text-ink">
                      {thread?.userName ?? thread?.phone ?? 'Conversación'}
                    </h2>
                    {thread?.userName && <p className="text-xs text-ink-3">{thread.phone}</p>}
                  </div>
                  {thread?.lastInboundAt && (
                    <span className="flex items-center gap-1.5 text-[11px] text-ink-4">
                      <Clock className="size-3.5" aria-hidden="true" />
                      Último entrante: {formatDateTime(thread.lastInboundAt)}
                    </span>
                  )}
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {loadingThread ? (
                    <div className="flex h-full items-center justify-center text-ink-4">
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    </div>
                  ) : thread && thread.messages.length > 0 ? (
                    thread.messages.map((message) => {
                      const outbound = message.direction === 'OUTBOUND'
                      return (
                        <div key={message.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-lg border px-3 py-2 ${
                              outbound
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-ink'
                                : 'border-edge-strong bg-surface-1 text-ink-2'
                            }`}
                          >
                            <p className="whitespace-pre-line text-sm">{message.body ?? message.templateName ?? '(sin contenido)'}</p>
                            <p className="mt-1 text-right text-[10px] text-ink-4">
                              {formatTime(message.createdAt)}
                              {message.errorCode ? ` · error ${message.errorCode}` : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-ink-3">No hay mensajes en esta conversación.</p>
                  )}
                </div>

                {error && (
                  <p className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-danger-text">{error}</p>
                )}

                {thread && !thread.withinServiceWindow && (
                  <p className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
                    Fuera de la ventana de 24h. Para reiniciar la conversación Meta requiere una plantilla aprobada.
                  </p>
                )}

                <form onSubmit={sendReply} className="border-t border-edge px-4 py-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={2}
                      maxLength={4096}
                      disabled={!canReply}
                      placeholder={canReply ? 'Escribe una respuesta…' : 'No disponible fuera de la ventana de 24h'}
                      className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!canReply || !reply.trim()}
                      className="flex items-center gap-2 rounded-md border border-cyan-500 bg-cyan-500 px-3 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                      Enviar
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
