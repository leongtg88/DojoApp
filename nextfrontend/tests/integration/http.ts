/** Construye un `Request` con cuerpo JSON para invocar handlers de ruta. */
export function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/** Segundo argumento de los handlers con segmento dinámico: `{ params: Promise<...> }`. */
export function routeParams<T>(value: T): { params: Promise<T> } {
  return { params: Promise.resolve(value) }
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}
