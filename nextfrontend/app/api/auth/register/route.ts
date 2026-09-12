import { NextResponse } from 'next/server'

// El acceso a la aplicación es exclusivo para personas que ya se inscribieron
// en el dojo y recibieron la invitación del administrador. No existe
// auto-registro: sin inscripción + invitación no se puede crear cuenta.
// El formulario de invitación vive en /registro/invitacion?token=...
export const runtime = 'nodejs'

const REGISTRATION_BLOCKED_MESSAGE =
  'Para ingresar a la app debes haberte inscrito y haber recibido la invitación de la escuela. Completa el formulario de inscripción y espera el enlace del dojo.'

export async function POST() {
  return NextResponse.json({ error: REGISTRATION_BLOCKED_MESSAGE }, { status: 403 })
}