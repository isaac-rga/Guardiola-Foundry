import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { useProductVariantCandidates } from './api/bills-of-materials'
import { CreateBomPage } from './create-bom-template-page'

export function ImplementationBuilder({
  onExit,
  productVariantId,
}: {
  onExit: () => void
  productVariantId: string
}) {
  const { session } = useAppShell()
  const search = useProductVariantCandidates(session.token, productVariantId)
  const candidate = search.data?.items.find(
    (item) => item.id === productVariantId,
  )

  if (search.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading Product Variant...
      </p>
    )
  }
  if (search.error || !candidate || !candidate.selectable) {
    return (
      <div className="space-y-4">
        <p role="alert">
          {search.error?.message ?? 'Product Variant details are unavailable.'}
        </p>
        <Button onClick={onExit} type="button" variant="link">
          Back to catalog
        </Button>
      </div>
    )
  }

  return (
    <CreateBomPage
      creation={{ kind: 'implementation', productVariant: candidate }}
      onCancel={onExit}
      onSaved={onExit}
    />
  )
}
