import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { InvitationSetupForm } from '@/components/auth/InvitationSetupForm'

export default function InvitacionRegistroPage() {
  return (
    <AuthSplitLayout mode="registro">
      <InvitationSetupForm />
    </AuthSplitLayout>
  )
}