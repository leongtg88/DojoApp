'use client';
import { useState } from 'react';
import HomeView from '@/components/HomeView';
import DojoEnrollmentModal from '@/components/DojoEnrollmentModal';
import AssistantLauncher from '@/components/assistant/AssistantLauncher';
import AssistantModal from '@/components/assistant/AssistantModal';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProgram, setPreSelectedProgram] = useState<'kid' | 'adult'>('adult');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleOpenEnrollment = (program: string = 'adult') => {
    setPreSelectedProgram(program === 'kid' ? 'kid' : 'adult');
    setIsModalOpen(true);
  };

  return (
    <>
      <HomeView onOpenEnrollment={handleOpenEnrollment} onOpenAssistant={() => setIsAssistantOpen(true)} />
      <DojoEnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preSelectedProgram={preSelectedProgram} />
      {!isAssistantOpen && <AssistantLauncher onOpen={() => setIsAssistantOpen(true)} />}
      {isAssistantOpen && <AssistantModal onClose={() => setIsAssistantOpen(false)} />}
    </>
  );
}
