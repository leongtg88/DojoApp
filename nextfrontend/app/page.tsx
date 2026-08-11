'use client';
import { useState } from 'react';
import HomeView from '@/components/HomeView';
import DojoEnrollmentModal from '@/components/DojoEnrollmentModal';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProgram, setPreSelectedProgram] = useState<'kid' | 'adult'>('adult');

  const handleOpenEnrollment = (program: string = 'adult') => {
    setPreSelectedProgram(program === 'kid' ? 'kid' : 'adult');
    setIsModalOpen(true);
  };

  return (
    <>
      <HomeView onOpenEnrollment={handleOpenEnrollment} />
      <DojoEnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preSelectedProgram={preSelectedProgram} />
    </>
  );
}
