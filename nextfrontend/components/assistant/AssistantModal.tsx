'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import useEnrollmentChat from '@/hooks/useEnrollmentChat';
import MessageBubble from './MessageBubble';
import QuickReplies from './QuickReplies';
import ScheduleCard from './ScheduleCard';
import SummaryCard from './SummaryCard';
import TextInputForm from './TextInputForm';
import type { ScheduleCard as ScheduleCardData } from '@/lib/flow';

export default function AssistantModal({ onClose }: { onClose: () => void }) {
  const chat = useEnrollmentChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.messages, chat.quickReplies, chat.input]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-700 text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Asistente Tosei Gusoku</h2>
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              Sensei online · Lun-Vie 2:30 PM - 7:30 PM
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
          aria-label="Cerrar asistente"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
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
                  <ScheduleCard key={idx} title={card.title} subtitle={card.value} />
                ),
              )}
              {m.summary && <SummaryCard data={chat.draft} />}
            </div>
          ),
        )}

        {chat.quickReplies.length > 0 && <QuickReplies options={chat.quickReplies} onSelect={chat.selectOption} />}
        {chat.input && (
          <TextInputForm
            placeholder={chat.placeholder}
            onSubmit={chat.submitText}
            validationError={chat.validationError ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
