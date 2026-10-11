'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId, type ComponentProps, type MouseEvent } from 'react'
import { useNavigationLoading } from './NavigationLoadingProvider'

type NavLinkProps = ComponentProps<typeof Link>

export function NavLink({ href, className, onClick, children, target, ...rest }: NavLinkProps) {
  const pathname = usePathname()
  const token = useId()
  const { pendingToken, startLoading } = useNavigationLoading()

  const hrefString = typeof href === 'string' ? href : href.pathname ?? '/'
  const targetPath = hrefString.split('?')[0].split('#')[0] || '/'
  const isPending = pendingToken === token

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (target === '_blank') return
    if (targetPath === pathname) return
    startLoading(hrefString, token)
  }

  const mergedClassName = `${className ?? ''}${isPending ? ' nav-link-pending' : ''}`.trim()

  return (
    <Link {...rest} href={href} target={target} onClick={handleClick} className={mergedClassName} data-navlink="true">
      {children}
    </Link>
  )
}
