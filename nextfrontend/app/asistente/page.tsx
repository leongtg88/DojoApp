'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react';
import useEnrollmentChat from '@/hooks/useEnrollmentChat';
import MessageBubble from '@/components/assistant/MessageBubble';
import QuickReplies from '@/components/assistant/QuickReplies';
import ScheduleCard from '@/components/assistant/ScheduleCard';
import SummaryCard from '@/components/assistant/SummaryCard';
import PricingSummaryCard from '@/components/assistant/PricingSummaryCard';
import TextInputForm from '@/components/assistant/TextInputForm';
import PriceCard from '@/components/assistant/PriceCard';
import ClearChatModal from '@/components/assistant/ClearChatModal';
import type { ScheduleCard as ScheduleCardData } from '@/lib/flow';
import type { PriceCard as PriceCardData } from '@/lib/flow';

export default function AssistantPage() {
  const chat = useEnrollmentChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.messages, chat.quickReplies, chat.input]);

  return (
    <div className="bg-asistent-bgdark min-h-[calc(100dvh-5rem)]  font-sans text-asistent-bgsurface antialiased selection:bg-asistent-bgpurple selection:text-white md:-mb-20">
      <header className="sticky top-20 z-10 border-b border-white/10  px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={chat.goBack}
            disabled={!chat.canGoBack}
            aria-label="Volver"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-black">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Asistente Tosei Gusoku</h2>
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              Sensei online · Lun-Vie 2:30 PM - 7:30 PM
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            disabled={!chat.canGoBack}
            aria-label="Limpiar conversación"
            title="Limpiar conversación"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="fixed top-[20%] left-[-15%] w-[600px] h-[600px] bg-asistent-bgpurple/20 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-[20%] right-[-15%] w-[600px] h-[600px] bg-asistent-bgaqua/20 rounded-full blur-[180px] pointer-events-none z-0" />
      <div ref={scrollRef} className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
        {chat.messages.map((m) =>
          m.role === 'user' ? (
            <MessageBubble key={m.id} role="user">
              {m.text}
            </MessageBubble>
          ) : (
            <div key={m.id} className="space-y-3">
              {m.text && (
                <MessageBubble role="assistant">{m.text}</MessageBubble>
              )}
              {m.link && (
                <a
                  href={m.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-accent/40 bg-brand-accent/10 px-4 py-2.5 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent hover:text-black"
                >
                  {m.link.label}
                </a>
              )}
              {m.cards?.map((card, idx) =>
                card.kind === 'schedule' ? (
                  <ScheduleCard
                    key={idx}
                    title={card.title}
                    subtitle={card.schedule}
                    ctaLabel={card.cta}
                    onCta={() => chat.selectCard(card as ScheduleCardData)}
                  />
                ) : (
                  <PriceCard
                    key={idx}
                    title={card.title}
                    value={card.value}
                    description={(card as PriceCardData).description}
                    originalPrice={(card as PriceCardData).originalPrice}
                    badge={(card as PriceCardData).badge}
                  />
                ),
              )}
              {m.summary && chat.draft.tipo === 'cotizacion' && <PricingSummaryCard draft={chat.draft} />}
              {m.summary && chat.draft.tipo !== 'cotizacion' && <SummaryCard data={chat.draft} />}
            </div>
          ),
        )}

        {chat.quickReplies.length > 0 && <QuickReplies options={chat.quickReplies} onSelect={chat.selectOption} />}
        {chat.input && (
          <TextInputForm
            key={chat.currentNodeId}
            defaultValue={chat.inputValue}
            placeholder={chat.placeholder}
            onSubmit={chat.submitText}
            validationError={chat.validationError ?? undefined}
          />
        )}
      </div>

      <ClearChatModal
        isOpen={showClearModal}
        onCancel={() => setShowClearModal(false)}
        onConfirm={() => {
          chat.reset();
          setShowClearModal(false);
        }}
      />
    </div>
  );
}
