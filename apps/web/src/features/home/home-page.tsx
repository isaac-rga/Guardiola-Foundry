import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-xl space-y-6 text-center">
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">ERP Platform</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Guardiola Foundry</h1>
        <p className="text-balance text-muted-foreground">
          The application foundation is ready. Business modules will be added from approved specifications.
        </p>
        <Button type="button" disabled>
          Scaffold ready
        </Button>
      </section>
    </main>
  )
}
