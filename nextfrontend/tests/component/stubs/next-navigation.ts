// Stub de `next/navigation` para pruebas de componentes (jsdom).
// Implementaciones mínimas con las APIs que usan los componentes cliente.
type RouterMock = {
  push: (href: string) => void
  replace: (href: string) => void
  refresh: () => void
  back: () => void
  forward: () => void
  prefetch: (href?: string) => void
}

export function useRouter(): RouterMock {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  }
}

export function usePathname(): string {
  return '/'
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams()
}

export function useParams(): Record<string, string> {
  return {}
}

export function redirect(): void {}

export function notFound(): never {
  throw new Error('notFound() en prueba')
}
