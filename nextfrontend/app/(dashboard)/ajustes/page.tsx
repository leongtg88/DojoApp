import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { PasskeyManager, type PasskeyCredential } from '@/components/security/PasskeyManager'

export default async function AjustesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const credentials = await db.webAuthnCredential.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      backedUp: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })

  const initialCredentials: PasskeyCredential[] = credentials.map((credential) => ({
    id: credential.id,
    deviceName: credential.deviceName,
    deviceType: credential.deviceType,
    backedUp: credential.backedUp,
    createdAt: credential.createdAt.toISOString(),
    lastUsedAt: credential.lastUsedAt ? credential.lastUsedAt.toISOString() : null,
  }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-4">Ajustes de la cuenta</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Seguridad</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-3">
          Administra cómo accedes al portal del dojo. El ingreso con huella o Face ID usa las llaves de seguridad del
          dispositivo (WebAuthn) y te permite entrar sin escribir tu contraseña.
        </p>
      </header>

      <PasskeyManager initialCredentials={initialCredentials} />
    </main>
  )
}
