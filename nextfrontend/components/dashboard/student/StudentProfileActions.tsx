'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'
import { EditProfileModal } from './EditProfileModal'

interface StudentProfileActionsProps {
    profile: StudentProfile
}

export function StudentProfileActions({ profile }: StudentProfileActionsProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
                onClick={() => setIsOpen(true)}
                type="button"
            >
                <Pencil aria-hidden="true" className="size-4" />
                Editar datos personales
            </button>
            {isOpen && <EditProfileModal onClose={() => setIsOpen(false)} profile={profile} />}
        </>
    )
}