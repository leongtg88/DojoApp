import { redirect } from 'next/navigation'

export default function LegacyStudentUnauthorizedPage() {
    redirect('/no-autorizado')
}
