import { Link } from '@tanstack/react-router'

export function MaterialsAreaNavigation() {
  return (
    <nav
      className="flex w-fit rounded-xl border border-border/70 bg-muted/25 p-1"
      aria-label="Materials area views"
    >
      <AreaLink to="/app/materials">Materials</AreaLink>
      <AreaLink to="/app/sources">Sources</AreaLink>
    </nav>
  )
}

function AreaLink({
  children,
  to,
}: {
  children: string
  to: '/app/materials' | '/app/sources'
}) {
  return (
    <Link
      to={to}
      className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: 'bg-background text-foreground shadow-sm' }}
    >
      {children}
    </Link>
  )
}
