import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <main className="px-6 py-10 md:px-10 md:py-14">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="flex flex-col justify-center rounded-[2rem] border border-border/70 bg-card/90 px-8 py-12 shadow-[0_24px_80px_rgba(72,53,40,0.08)] md:px-12">
          <p className="text-xs font-medium tracking-[0.28em] text-muted-foreground uppercase">
            Guardiola Bridal
          </p>
          <h1 className="font-editorial mt-6 max-w-3xl text-5xl leading-none text-foreground sm:text-6xl">
            Guardiola Foundry
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            A private operating system for collections, sourcing, inventory, orders, and retailer-facing resources.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            The interface follows an editorial fashion-house hierarchy while keeping operational screens practical and fast.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" type="button">
              <a href="/sign-in">Sign in</a>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 self-center">
          <article className="rounded-[1.75rem] border border-border/70 bg-card/88 p-6 shadow-[0_18px_48px_rgba(72,53,40,0.06)]">
            <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              Design direction
            </p>
            <h2 className="mt-4 text-xl font-medium">Modern software with editorial fashion house DNA.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Warm ivory surfaces, quiet contrast, practical tables, and restrained hierarchy keep the app brand-aligned without becoming decorative.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border/70 bg-muted/45 p-6">
            <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              Current scope
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
              <li>Product lifecycle and collection oversight</li>
              <li>Materials and sourcing visibility</li>
              <li>Inventory, BOMs, and production readiness</li>
              <li>Retailer resource and CRM workflows</li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  )
}
