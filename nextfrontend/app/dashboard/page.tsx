import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { RolePicker } from '@/components/dashboard/shell/RolePicker'
import { getRolePanelOptions } from '@/components/dashboard/shell/RolePanels'
import type { DashboardRole } from '@/types/dashboard'

export default async function DashboardIndexPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const roles = ((session.user.roles && session.user.roles.length > 0 ? session.user.roles : [session.user.role]) ?? []) as DashboardRole[]
  const options = getRolePanelOptions(roles)

  if (options.length === 0) {
    redirect('/no-autorizado')
  }

  if (options.length === 1) {
    redirect(options[0].href)
  }

  return <RolePicker roles={roles} userName={session.user.name} />
}