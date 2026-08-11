'use client';
import { useState } from 'react';
import AboutView from '@/components/AboutView';
import DojoEnrollmentModal from '@/components/DojoEnrollmentModal';

export default function NosotrosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProgram, setPreSelectedProgram] = useState<'kid' | 'adult'>('adult');

  const handleOpenEnrollment = (program: string = 'adult') => {
    setPreSelectedProgram(program === 'kid' ? 'kid' : 'adult');
    setIsModalOpen(true);
  };

  return (
    <>
      <AboutView onOpenEnrollment={handleOpenEnrollment} />
      <DojoEnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preSelectedProgram={preSelectedProgram} />
    </>
  );
}
