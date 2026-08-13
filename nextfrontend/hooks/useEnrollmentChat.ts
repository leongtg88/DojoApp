'use client';

import { useCallback, useReducer } from 'react';
import {
  flow,
  type EnrollmentDraft,
  type FlowCard,
  type FlowEffect,
  type FlowNode,
  type FlowNodeId,
  type ScheduleCard,
  type ValidationKind,
  type WaTextKind,
} from '@/lib/flow';
import { validateAge, validateEmail, validateName, validateWhatsApp } from '@/lib/validation';
import { buildWhatsAppLink, buildWhatsAppTextLink, WA_GENERIC_TEXT, WA_QUOTE_TEXT } from '@/lib/whatsapp';

export const EMPTY_DRAFT: EnrollmentDraft = {
  tipo: '',
  tipo_alumno: '',
  edad: '',
  programa: '',
  horario_pref: '',
  nombre: '',
  whatsapp: '',
  email: '',
  nota: '',
  utm: 'asistente_web',
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  nodeId?: string;
  cards?: FlowCard[];
  summary?: boolean;
}

interface ChatState {
  currentNodeId: FlowNodeId;
  messages: ChatMessage[];
  draft: EnrollmentDraft;
  quickReplies: string[];
  input: boolean;
  placeholder: string;
  validation: ValidationKind | null;
  validationError: string | null;
}

type Action =
  | { type: 'SELECT'; option: string }
  | { type: 'SUBMIT'; value: string }
  | { type: 'CARD'; card: ScheduleCard }
  | { type: 'VALIDATION_ERROR' }
  | { type: 'RESET' };

const ERROR_MESSAGES: Record<ValidationKind, string> = {
  name: 'Por favor ingresa un nombre válido (mínimo 2 caracteres).',
  whatsapp: 'Ingresa un número válido con prefijo internacional, ej. +18296378733.',
  email: 'Ingresa un email válido (puedes omitirlo si prefieres).',
  age: 'Ingresa una edad válida entre 3 y 100 años.',
};

let messageSeq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${messageSeq++}`;

function validateField(kind: ValidationKind, value: string): boolean {
  switch (kind) {
    case 'name':
      return validateName(value);
    case 'whatsapp':
      return validateWhatsApp(value);
    case 'email':
      return validateEmail(value);
    case 'age':
      return validateAge(value);
  }
}

function getNodeCards(node: FlowNode, draft: EnrollmentDraft): FlowCard[] {
  if (node.dynamicCards) return node.dynamicCards(draft);
  return node.cards ?? [];
}

function getNodeQuickReplies(node: FlowNode, draft: EnrollmentDraft): string[] {
  if (node.dynamicQuickReplies) return node.dynamicQuickReplies(draft);
  return node.quickReplies ?? [];
}

function getTargetId(node: FlowNode, value: string): FlowNodeId {
  if (typeof node.next === 'string') return node.next;
  return node.next?.[value] ?? 'welcome';
}

function buildAssistantMessage(target: FlowNode, draft: EnrollmentDraft, nodeId: FlowNodeId): ChatMessage {
  const cards = getNodeCards(target, draft);
  return {
    id: nextId('assistant'),
    role: 'assistant',
    nodeId,
    text: target.message,
    cards: cards.length ? cards : undefined,
    summary: target.summary || undefined,
  };
}

function transition(state: ChatState, userText: string, targetId: FlowNodeId, draft: EnrollmentDraft): ChatState {
  const target = flow[targetId];
  const nextDraft = targetId === 'welcome' ? { ...EMPTY_DRAFT } : draft;
  const lastAssistant = [...state.messages].reverse().find((m) => m.role === 'assistant');

  const messages: ChatMessage[] = [...state.messages, { id: nextId('user'), role: 'user', text: userText }];
  if (lastAssistant?.nodeId !== targetId) {
    messages.push(buildAssistantMessage(target, nextDraft, targetId));
  }

  return {
    currentNodeId: targetId,
    messages,
    draft: nextDraft,
    quickReplies: getNodeQuickReplies(target, nextDraft),
    input: !!target.input,
    placeholder: target.placeholder ?? '',
    validation: target.validation ?? null,
    validationError: null,
  };
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'RESET':
      return init();
    case 'VALIDATION_ERROR':
      return { ...state, validationError: ERROR_MESSAGES[state.validation ?? 'name'] };
    case 'SELECT': {
      const node = flow[state.currentNodeId];
      const targetId = getTargetId(node, action.option);
      const draft = node.store ? node.store(state.draft, action.option) : state.draft;
      return transition(state, action.option, targetId, draft);
    }
    case 'SUBMIT': {
      const node = flow[state.currentNodeId];
      const targetId = typeof node.next === 'string' ? node.next : 'welcome';
      const draft = node.store ? node.store(state.draft, action.value) : state.draft;
      return transition(state, action.value, targetId, draft);
    }
    case 'CARD': {
      const targetId = action.card.next;
      const draft = action.card.store ? action.card.store(state.draft, '') : state.draft;
      return transition(state, action.card.cta, targetId, draft);
    }
  }
}

function init(): ChatState {
  const welcome = flow.welcome;
  return {
    currentNodeId: 'welcome',
    messages: [{ id: nextId('assistant'), role: 'assistant', nodeId: 'welcome', text: welcome.message }],
    draft: { ...EMPTY_DRAFT },
    quickReplies: welcome.quickReplies ?? [],
    input: false,
    placeholder: '',
    validation: null,
    validationError: null,
  };
}

function buildWaUrl(kind: WaTextKind, draft: EnrollmentDraft): string {
  const payload = {
    nombre: draft.nombre,
    edad: draft.edad,
    horario_pref: draft.horario_pref,
    programa: draft.programa,
    whatsapp: draft.whatsapp,
    nota: draft.nota,
  };
  switch (kind) {
    case 'enrollment':
      return buildWhatsAppLink(payload);
    case 'quote':
      return buildWhatsAppTextLink(WA_QUOTE_TEXT);
    case 'generic':
      return buildWhatsAppTextLink(WA_GENERIC_TEXT);
    case 'auto':
    default:
      return draft.nombre && draft.whatsapp && draft.horario_pref ? buildWhatsAppLink(payload) : buildWhatsAppTextLink(WA_GENERIC_TEXT);
  }
}

export default function useEnrollmentChat() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  const applyEffects = useCallback((effect: FlowEffect | undefined, draft: EnrollmentDraft) => {
    if (!effect) return;
    if (effect.openWhatsApp) {
      const url = buildWaUrl(effect.waText ?? 'auto', draft);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    if (effect.post) {
      fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, utm: 'asistente_web' }),
      }).catch(() => {});
    }
  }, []);

  const selectOption = useCallback(
    (option: string) => {
      const node = flow[state.currentNodeId];
      const targetId = getTargetId(node, option);
      const target = flow[targetId];
      const draft = node.store ? node.store(state.draft, option) : state.draft;
      if (target?.effect) applyEffects(target.effect, draft);
      dispatch({ type: 'SELECT', option });
    },
    [state.currentNodeId, state.draft, applyEffects],
  );

  const submitText = useCallback(
    (value: string): boolean => {
      const node = flow[state.currentNodeId];
      if (node.validation) {
        const ok = validateField(node.validation, value);
        if (!ok) {
          dispatch({ type: 'VALIDATION_ERROR' });
          return false;
        }
      }
      const targetId = typeof node.next === 'string' ? node.next : 'welcome';
      const target = flow[targetId];
      const draft = node.store ? node.store(state.draft, value) : state.draft;
      if (target?.effect) applyEffects(target.effect, draft);
      dispatch({ type: 'SUBMIT', value });
      return true;
    },
    [state.currentNodeId, state.draft, applyEffects],
  );

  const selectCard = useCallback(
    (card: ScheduleCard) => {
      const target = flow[card.next];
      const draft = card.store ? card.store(state.draft, '') : state.draft;
      if (target?.effect) applyEffects(target.effect, draft);
      dispatch({ type: 'CARD', card });
    },
    [state.draft, applyEffects],
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { ...state, selectOption, submitText, selectCard, reset };
}
