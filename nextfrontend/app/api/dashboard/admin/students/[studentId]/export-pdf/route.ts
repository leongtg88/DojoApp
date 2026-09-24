import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { resolveRegistrationSources, buildRegistrationFlatValues } from '@/lib/dashboard/registration-data'
import { buildCarnetPdf, type CarnetData } from '@/lib/pdf/carnet'
import { downloadPrivateDocument } from '@/lib/document-storage'
import { hasAnyRole } from '@/lib/auth/roles'

interface ExportRouteContext {
  params: Promise<{ studentId: string }>
}

function toDdMmYyyy(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = date.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function GET(_request: Request, context: ExportRouteContext) {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await context.params
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
      contactPhone: true,
      email: true,
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

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const { perfilData, enrollmentFormData } = resolveRegistrationSources({
    registrationData: student.registrationData as Record<string, unknown> | null | undefined,
    enrollments: student.enrollments,
  })
  const perfil = buildRegistrationFlatValues(perfilData, enrollmentFormData)

  const data: CarnetData = {
    apellidos: student.lastName,
    nombres: student.firstName,
    fechaNacimiento: toDdMmYyyy(student.dateOfBirth),
    sexo: student.gender === 'FEMALE' ? 'FEMALE' : student.gender === 'MALE' ? 'MALE' : null,
    tipoSangre: (perfil.bloodType as string | null) ?? null,
    telefono:
      student.contactPhone ??
      student.user?.phone ??
      (student.enrollments.find((enrollment) => enrollment.contactPhone)?.contactPhone ?? null),
    cedula: (perfil.nationalId as string | null) ?? null,
    direccion: (perfil.address as string | null) ?? null,
    grado: student.currentRank ?? null,
  }

  // Foto de perfil (photoKey o documento PROFILE_PHOTO).
  const photoKey = student.photoKey ?? student.documents[0]?.storageKey ?? null
  if (photoKey) {
    try {
      const { buffer, contentType } = await downloadPrivateDocument(photoKey)
      if (contentType === 'image/png' || contentType === 'image/jpeg') {
        data.foto = { bytes: new Uint8Array(buffer), mime: contentType }
      }
    } catch (error) {
      console.error('[carnet] No fue posible leer la foto de perfil', error)
    }
  }

  try {
    const bytes = await buildCarnetPdf(data)
    const fileName = `carnet-federacion-${slugify(`${student.firstName}-${student.lastName}`) || student.id}.pdf`

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generando el carnet de la federación:', error)
    return NextResponse.json({ error: 'No fue posible generar el carnet de la federación' }, { status: 500 })
  }
}