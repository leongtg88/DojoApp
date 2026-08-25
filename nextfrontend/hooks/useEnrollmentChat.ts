'use client';

import { useCallback, useReducer } from 'react';
import {
  flow,
  INPUT_FIELD,
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
import { buildWhatsAppLink, buildCotizacionLink, buildWhatsAppTextLink, buildEnrollmentWithCotizacionLink, WA_GENERIC_TEXT, WA_QUOTE_TEXT } from '@/lib/whatsapp';

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
  plan_seleccionado: '',
  plan_precio: '',
  protecciones: '',
  protecciones_precio: '',
  descuento_seleccionado: '',
  acuerdo_pago: false,
  from_cotizacion: false,
  cotizacion_nombre: '',
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  nodeId?: string;
  cards?: FlowCard[];
  summary?: boolean;
  link?: { label: string; url: string };
}

interface HistoryEntry {
  nodeId: FlowNodeId;
  draft: EnrollmentDraft;
}

const MAX_HISTORY = 50;

interface ChatState {
  currentNodeId: FlowNodeId;
  startNodeId?: FlowNodeId;
  messages: ChatMessage[];
  draft: EnrollmentDraft;
  quickReplies: string[];
  input: boolean;
  placeholder: string;
  validation: ValidationKind | null;
  validationError: string | null;
  history: HistoryEntry[];
}

type Action =
  | { type: 'SELECT'; option: string }
  | { type: 'SUBMIT'; value: string }
  | { type: 'CARD'; card: ScheduleCard }
  | { type: 'VALIDATION_ERROR' }
  | { type: 'BACK' }
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

function getTargetId(node: FlowNode, value: string, draft: EnrollmentDraft): FlowNodeId {
  const next = node.dynamicNext?.(draft) ?? node.next;
  if (typeof next === 'string') return next;
  return next?.[value] ?? 'welcome';
}

function buildAssistantMessage(target: FlowNode, draft: EnrollmentDraft, nodeId: FlowNodeId): ChatMessage {
  const cards = getNodeCards(target, draft);
  return {
    id: nextId('assistant'),
    role: 'assistant',
    nodeId,
    text: target.getMessage?.(draft) ?? target.message,
    cards: cards.length ? cards : undefined,
    summary: target.summary || undefined,
    link: target.link,
  };
}

function transition(state: ChatState, userText: string, targetId: FlowNodeId, draft: EnrollmentDraft): ChatState {
  const target = flow[targetId];
  const nextDraft =
    targetId === 'welcome'
      ? { ...EMPTY_DRAFT, nombre: draft.nombre, whatsapp: draft.whatsapp, email: draft.email }
      : draft;
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
    history: [...state.history, { nodeId: state.currentNodeId, draft: state.draft }].slice(-MAX_HISTORY),
  };
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'RESET':
      return init(state.startNodeId);
    case 'VALIDATION_ERROR':
      return { ...state, validationError: ERROR_MESSAGES[state.validation ?? 'name'] };
    case 'BACK': {
      if (!state.history.length) return state;
      const history = [...state.history];
      const prev = history.pop()!;
      const node = flow[prev.nodeId];
      const lastAssistant = [...state.messages].reverse().find((m) => m.role === 'assistant');
      const messages: ChatMessage[] = [...state.messages, { id: nextId('user'), role: 'user', text: 'Volver' }];
      if (lastAssistant?.nodeId !== prev.nodeId) {
        messages.push(buildAssistantMessage(node, prev.draft, prev.nodeId));
      }
      return {
        currentNodeId: prev.nodeId,
        messages,
        draft: prev.draft,
        quickReplies: getNodeQuickReplies(node, prev.draft),
        input: !!node.input,
        placeholder: node.placeholder ?? '',
        validation: node.validation ?? null,
        validationError: null,
        history,
      };
    }
    case 'SELECT': {
      const node = flow[state.currentNodeId];
      const targetId = getTargetId(node, action.option, state.draft);
      const draft = node.store ? node.store(state.draft, action.option) : state.draft;
      return transition(state, action.option, targetId, draft);
    }
    case 'SUBMIT': {
      const node = flow[state.currentNodeId];
      const next = node.dynamicNext?.(state.draft) ?? node.next;
      const targetId = typeof next === 'string' ? next : 'welcome';
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

function init(startNodeId?: FlowNodeId): ChatState {
  const start: FlowNodeId = startNodeId && flow[startNodeId] ? startNodeId : 'welcome';
  const node = flow[start];
  return {
    currentNodeId: start,
    startNodeId: start === 'welcome' ? undefined : start,
    messages: [buildAssistantMessage(node, { ...EMPTY_DRAFT }, start)],
    draft: { ...EMPTY_DRAFT },
    quickReplies: getNodeQuickReplies(node, { ...EMPTY_DRAFT }),
    input: !!node.input,
    placeholder: node.placeholder ?? '',
    validation: null,
    validationError: null,
    history: [],
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
      if (draft.from_cotizacion && draft.plan_seleccionado) {
        return buildEnrollmentWithCotizacionLink(payload, {
          nombre: draft.cotizacion_nombre || draft.nombre,
          whatsapp: draft.whatsapp,
          email: draft.email,
          plan_seleccionado: draft.plan_seleccionado,
          plan_precio: draft.plan_precio,
          protecciones: draft.protecciones,
          protecciones_precio: draft.protecciones_precio,
          descuento_seleccionado: draft.descuento_seleccionado,
          acuerdo_pago: draft.acuerdo_pago,
        });
      }
      return buildWhatsAppLink(payload);
    case 'cotizacion':
      return buildCotizacionLink({
        nombre: draft.nombre,
        whatsapp: draft.whatsapp,
        email: draft.email,
        plan_seleccionado: draft.plan_seleccionado,
        plan_precio: draft.plan_precio,
        protecciones: draft.protecciones,
        protecciones_precio: draft.protecciones_precio,
        descuento_seleccionado: draft.descuento_seleccionado,
        acuerdo_pago: draft.acuerdo_pago,
      });
    case 'quote':
      return buildWhatsAppTextLink(WA_QUOTE_TEXT);
    case 'generic':
      return buildWhatsAppTextLink(WA_GENERIC_TEXT);
    case 'auto':
    default:
      return draft.nombre && draft.whatsapp && draft.horario_pref ? buildWhatsAppLink(payload) : buildWhatsAppTextLink(WA_GENERIC_TEXT);
  }
}

export default function useEnrollmentChat(startNodeId?: FlowNodeId) {
  const [state, dispatch] = useReducer(reducer, startNodeId, init);

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
      if (option === 'Volver' && state.history.length > 0) {
        dispatch({ type: 'BACK' });
        return;
      }
      const targetId = getTargetId(node, option, state.draft);
      const target = flow[targetId];
      const draft = node.store ? node.store(state.draft, option) : state.draft;
      if (target?.effect) applyEffects(target.effect, draft);
      dispatch({ type: 'SELECT', option });
    },
    [state.currentNodeId, state.draft, state.history.length, applyEffects],
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
      const next = node.dynamicNext?.(state.draft) ?? node.next;
      const targetId = typeof next === 'string' ? next : 'welcome';
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
  const goBack = useCallback(() => dispatch({ type: 'BACK' }), []);

  const inputField = INPUT_FIELD[state.currentNodeId];
  const inputValue = inputField ? String(state.draft[inputField] ?? '') : '';

  return { ...state, selectOption, submitText, selectCard, reset, goBack, canGoBack: state.history.length > 0, inputValue };
}
