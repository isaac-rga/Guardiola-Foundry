import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageHeaderProps = {
  action?: ReactNode
  className?: string
  description: string
  title: string
}

export function PageHeader({
  action,
  className,
  description,
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
        <div className="max-w-3xl space-y-3">
          <h1 className="font-editorial text-4xl leading-none text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </div>
    </section>
  )
}
