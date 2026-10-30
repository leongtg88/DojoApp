import { describe, expect, it } from 'vitest'
import { isMissingDocumentError } from '@/lib/document-storage'

describe('isMissingDocumentError', () => {
  it('detecta un objeto que ya no existe en el bucket', () => {
    const error = new Error('El documento no se encontró en el sistema.') as Error & { cause?: unknown }
    error.cause = { code: 'NoSuchKey', message: 'Object not found', statusCode: '404' }

    expect(isMissingDocumentError(error)).toBe(true)
  })

  it('detecta un StorageError con statusCode 404 aunque no tenga cause', () => {
    expect(isMissingDocumentError({ message: 'Object not found', statusCode: '404' })).toBe(true)
  })

  it('no confunde un bucket mal configurado con un archivo ausente', () => {
    const error = new Error('El almacenamiento de documentos no está configurado correctamente.') as Error & { cause?: unknown }
    error.cause = { code: 'NoSuchBucket', message: 'Bucket not found', statusCode: '404' }

    expect(isMissingDocumentError(error)).toBe(false)
  })

  it('no marca como ausentes los errores desconocidos', () => {
    expect(isMissingDocumentError(new Error('fetch failed'))).toBe(false)
  })
})
