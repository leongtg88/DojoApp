import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { RegistrationClosedNotice } from '@/components/auth/RegistrationClosedNotice'

export default function RegistroPage() {
  return (
    <AuthSplitLayout mode="registro">
      <RegistrationClosedNotice />
    </AuthSplitLayout>
  )
}