import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { listAllPrivateDocuments, PENDING_UPLOADS_PREFIX, privateDocumentExists } from '@/lib/document-storage-core'

dotenv.config({ path: '.env.local' })

// Script de SOLO LECTURA: cruza los documentos del expediente con los objetos que
// existen de verdad en Supabase Storage y lista los que ya no están.
//
// Sirve para medir el daño del barrido de subidas pendientes: cualquier documento
// confirmado con `storageKey` bajo `enrollments/pending/` y más de 24 h de
// antigüedad fue borrado por el cron antes del arreglo.
//
// Uso:
//   pnpm audit:documents           # revisa el prefijo efímero (rápido)
//   pnpm audit:documents --deep    # revisa también students/ (una consulta por documento)
//
// No modifica nada: ni la base de datos ni el storage.

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

function hostOf(url: string | undefined) {
  if (!url) return '(sin configurar)'
  try {
    return new URL(url).host
  } catch {
    return '(URL inválida)'
  }
}

async function main() {
  const deep = process.argv.includes('--deep')

  console.log(`BD:      ${hostOf(connectionString)}`)
  console.log(`Bucket:  ${process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'dojo-documents'}`)
  console.log(`Modo:    ${deep ? 'profundo (students/ incluido)' : 'rápido (solo enrollments/pending)'}\n`)

  const documents = await db.studentDocument.findMany({
    where: { studentId: { not: null } },
    select: {
      id: true,
      type: true,
      fileName: true,
      storageKey: true,
      uploadedAt: true,
      student: { select: { firstName: true, lastName: true, memberNumber: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  })

  const pendingPrefix = `${PENDING_UPLOADS_PREFIX}/`
  const pendingDocuments = documents.filter((document) => document.storageKey.startsWith(pendingPrefix))

  const existingObjects = await listAllPrivateDocuments(PENDING_UPLOADS_PREFIX)
  const existingKeys = new Set(existingObjects.map((object) => `${PENDING_UPLOADS_PREFIX}/${object.name}`))

  const missing = pendingDocuments.filter((document) => !existingKeys.has(document.storageKey))

  if (deep) {
    const others = documents.filter((document) => !document.storageKey.startsWith(pendingPrefix))
    for (const document of others) {
      try {
        if (!(await privateDocumentExists(document.storageKey))) missing.push(document)
      } catch (reason) {
        console.error(`  ! no se pudo comprobar ${document.id}:`, reason)
      }
    }
  }

  console.log(`Documentos del expediente (con alumno):        ${documents.length}`)
  console.log(`  · con storageKey en ${PENDING_UPLOADS_PREFIX}: ${pendingDocuments.length}`)
  console.log(`Objetos reales en ${PENDING_UPLOADS_PREFIX}:  ${existingObjects.length}`)
  console.log(`Documentos referenciados SIN archivo:          ${missing.length}\n`)

  if (missing.length === 0) {
    console.log('OK: no se encontraron documentos perdidos.')
    return
  }

  console.log('Alumnos afectados (hay que volver a pedirles el documento):\n')
  for (const document of missing) {
    const student = document.student
    const name = [student?.firstName, student?.lastName].filter(Boolean).join(' ') || '(sin nombre)'
    const member = student?.memberNumber ?? 'sin matrícula'
    const date = document.uploadedAt.toISOString().slice(0, 10)
    console.log(`- ${name} (${member}) · ${document.type} · ${document.fileName} · subido ${date}`)
    console.log(`  key: ${document.storageKey}`)
  }

  console.log(`\nTotal: ${missing.length} documento(s) perdido(s).`)
}

main()
  .catch((reason) => {
    console.error('La auditoría falló:', reason)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
