import * as React from 'react'

// Stub de `next/link` para pruebas: renderiza un <a> plano para no necesitar el
// runtime del App Router de Next en jsdom.
interface LinkStubProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname?: string }
}

export default function Link({ href, children, ...props }: LinkStubProps) {
  const resolved = typeof href === 'string' ? href : href?.pathname ?? '#'
  return (
    <a href={resolved} {...props}>
      {children}
    </a>
  )
}
