import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function RegistroPage() {
  return (
    <AuthSplitLayout mode="registro">
      <SignUpForm />
    </AuthSplitLayout>
  )
}
