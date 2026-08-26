'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeView from '@/components/HomeView';
import DojoEnrollmentModal from '@/components/DojoEnrollmentModal';

export default function HomeClient() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProgram, setPreSelectedProgram] = useState<'kid' | 'adult'>('adult');

  const handleOpenEnrollment = (program: string = 'adult') => {
    setPreSelectedProgram(program === 'kid' ? 'kid' : 'adult');
    setIsModalOpen(true);
  };

  return (
    <>
      <HomeView
        onOpenEnrollment={handleOpenEnrollment}
        onOpenAssistant={(target) => router.push(target ? `/asistente?nodo=${target}` : '/asistente')}
      />
      <DojoEnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preSelectedProgram={preSelectedProgram} />
    </>
  );
}