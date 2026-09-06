import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardIndexPage() {
  const session = await auth()

  switch (session?.user?.role) {
    case 'STUDENT':
      redirect('/dashboard/estudiante')
    case 'INSTRUCTOR':
      redirect('/dashboard/instructor')
    case 'SCHOOL_ADMIN':
    case 'SUPERADMIN':
      redirect('/dashboard/admin')
    default:
      redirect('/dashboard/no-autorizado')
  }
}