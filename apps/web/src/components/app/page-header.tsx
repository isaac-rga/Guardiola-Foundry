import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PageHeaderBadge = {
  label: string
  variant?: 'default' | 'secondary' | 'outline'
}

type PageHeaderProps = {
  action?: ReactNode
  badges?: PageHeaderBadge[]
  className?: string
  description: string
  eyebrow: string
  title: string
}

export function PageHeader({
  action,
  badges,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'rounded-[1.75rem] border border-border/70 bg-card/85 px-6 py-6 shadow-[0_18px_48px_rgba(72,53,40,0.06)] md:px-8 md:py-8',
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-medium tracking-[0.28em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <div className="space-y-3">
            <h1 className="font-editorial text-4xl leading-none text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
          {badges?.length ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant ?? 'secondary'}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </div>
    </section>
  )
}
