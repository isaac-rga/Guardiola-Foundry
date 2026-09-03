import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { useSourceDetail } from '@/features/sources/api/queries'
import { SourceEditFormPage } from '@/features/sources/source-create-page'

export function SourceEditPage({ sourceId }: { sourceId: string }) {
  const { session } = useAppShell()
  const sourceQuery = useSourceDetail(session.token, sourceId)

  if (sourceQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading Source...</p>
  }

  if (sourceQuery.isError || !sourceQuery.data) {
    return (
      <div className="space-y-4">
        <p
          className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {sourceQuery.error instanceof Error
            ? sourceQuery.error.message
            : 'Unable to load Source.'}
        </p>
        <Button asChild variant="outline">
          <Link to="/app/sources">Back to Sources</Link>
        </Button>
      </div>
    )
  }

  return <SourceEditFormPage source={sourceQuery.data.source} />
}
