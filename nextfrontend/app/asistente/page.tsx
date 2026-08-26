import type { Metadata } from 'next';
import AssistantChat from '@/components/assistant/AssistantChat';

export const metadata: Metadata = {
  title: 'Asistente Virtual',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AssistantPage() {
  return <AssistantChat />;
}