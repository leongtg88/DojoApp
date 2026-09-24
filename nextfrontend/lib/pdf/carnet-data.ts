import { db } from '@/lib/db'
import { resolveRegistrationSources, buildRegistrationFlatValues } from '@/lib/dashboard/registration-data'
import { buildCarnetPdf, type CarnetData } from './carnet'
import { uploadPrivateDocument, downloadPrivateDocument, sanitizeStorageName } from '@/lib/document-storage'
import { sendDocumentToTelegram } from '@/lib/integrations/telegram'

function toDdMmYyyy(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = date.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function hasValue(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

/**
 * Genera el carnet de la federación para un alumno recién convertido (tras la
 * revisión del admin), SOLO si están completos todos los campos del formulario.
 * Se guarda como documento del expediente y se envía por Telegram.
 * Es "best-effort": nunca lanza errores para no romper la conversión.
 */
export async function generateCarnetForStudent(studentId: string): Promise<void> {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        contactPhone: true,
        currentRank: true,
        registrationData: true,
        photoKey: true,
        user: { select: { phone: true } },
        documents: {
          where: { type: 'PROFILE_PHOTO' },
          orderBy: { uploadedAt: 'desc' },
          take: 1,
          select: { storageKey: true },
        },
        enrollments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            origin: true,
            status: true,
            createdAt: true,
            contactPhone: true,
            registrationData: true,
            applicants: { select: { id: true, name: true, dateOfBirth: true, profileData: true, studentId: true } },
          },
        },
      },
    })

    if (!student) return

    const { perfilData, enrollmentFormData } = resolveRegistrationSources({
      registrationData: student.registrationData as Record<string, unknown> | null | undefined,
      enrollments: student.enrollments,
    })
    const perfil = buildRegistrationFlatValues(perfilData, enrollmentFormData)
    const sexoDeclarado = student.gender ?? (perfil.sexo as string | null) ?? null

    const data: CarnetData = {
      apellidos: student.lastName,
      nombres: student.firstName,
      fechaNacimiento: toDdMmYyyy(student.dateOfBirth),
      sexo:
        sexoDeclarado === 'FEMALE' || sexoDeclarado === 'Femenino'
          ? 'FEMALE'
          : sexoDeclarado === 'MALE' || sexoDeclarado === 'Masculino'
            ? 'MALE'
            : null,
      tipoSangre: (perfil.bloodType as string | null) ?? null,
      telefono:
        student.contactPhone ??
        student.user?.phone ??
        (student.enrollments.find((enrollment) => enrollment.contactPhone)?.contactPhone ?? null),
      cedula: (perfil.nationalId as string | null) ?? null,
      direccion: (perfil.address as string | null) ?? null,
      grado: student.currentRank ?? null,
    }

    const photoKey = student.photoKey ?? student.documents[0]?.storageKey ?? null
    if (photoKey) {
      try {
        const { buffer, contentType } = await downloadPrivateDocument(photoKey)
        if (contentType === 'image/jpeg' || contentType === 'image/png') {
          data.foto = { bytes: new Uint8Array(buffer), mime: contentType }
        }
      } catch (error) {
        console.error('[carnet] No fue posible leer la foto de perfil', error)
      }
    }

    // Gate de completitud: TODOS los campos del carnet deben estar presentes.
    const missing: string[] = []
    const checks: Array<[string, unknown]> = [
      ['apellidos', data.apellidos],
      ['nombres', data.nombres],
      ['fechaNacimiento', data.fechaNacimiento],
      ['sexo', data.sexo],
      ['tipoSangre', data.tipoSangre],
      ['telefono', data.telefono],
      ['cedula', data.cedula],
      ['direccion', data.direccion],
      ['grado', data.grado],
      ['foto', data.foto],
    ]
    for (const [field, value] of checks) {
      if (!hasValue(value)) missing.push(field)
    }
    if (missing.length > 0) {
      console.warn(`[carnet] Datos incompletos al convertir; no se genera el carnet. Faltan: ${missing.join(', ')}`)
      return
    }

    const bytes = await buildCarnetPdf(data)

    const fileName = `carnet-federacion-${sanitizeStorageName(`${student.firstName}-${student.lastName}`)}-${new Date().toISOString().slice(0, 10)}.pdf`
    const storageKey = `carnet/students/${student.id}.pdf`

    // 1) Guardar como documento del expediente (Supabase).
    const file = new File([Buffer.from(bytes)], fileName, { type: 'application/pdf' })
    await uploadPrivateDocument(storageKey, file)
    await db.studentDocument.create({
      data: {
        studentId: student.id,
        type: 'OTHER',
        status: 'PENDING',
        fileName,
        storageKey,
        mimeType: 'application/pdf',
        fileSize: bytes.byteLength,
      },
    })

    // 2) Enviar el carnet por Telegram a los chats configurados.
    await sendDocumentToTelegram({
      fileName,
      bytes,
      mime: 'application/pdf',
      caption: `🥋 Carnet de federación — ${student.firstName} ${student.lastName}`,
    })
  } catch (error) {
    console.error('[carnet] No fue posible generar el carnet del alumno', error)
  }
}