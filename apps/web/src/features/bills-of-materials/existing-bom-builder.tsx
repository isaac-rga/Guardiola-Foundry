import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { useBillOfMaterials } from './api/bills-of-materials'
import { BomBuilderPage } from './create-bom-template-page'

export function ExistingBomBuilder({
  billOfMaterialsId,
  onExit,
}: {
  billOfMaterialsId: string
  onExit: () => void
}) {
  const { session } = useAppShell()
  const billOfMaterialsQuery = useBillOfMaterials(
    session.token,
    billOfMaterialsId,
  )

  if (billOfMaterialsQuery.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading Bill of Materials...
      </p>
    )
  }
  if (billOfMaterialsQuery.error || !billOfMaterialsQuery.data) {
    return (
      <div className="space-y-4">
        <p role="alert">
          {billOfMaterialsQuery.error?.message ??
            'Bill of Materials details are unavailable.'}
        </p>
        <Button onClick={onExit} type="button" variant="link">
          Back to catalog
        </Button>
      </div>
    )
  }

  const billOfMaterials = billOfMaterialsQuery.data
  const context =
    billOfMaterials.kind === 'template'
      ? ({ kind: 'template' } as const)
      : ({
          kind: 'implementation',
          productVariant: {
            id: billOfMaterials.productVariant!.id,
            name: billOfMaterials.productVariant!.name,
            product: billOfMaterials.product!,
          },
        } as const)

  return (
    <BomBuilderPage
      key={billOfMaterials.updatedAt}
      context={context}
      existing={billOfMaterials}
      onCancel={onExit}
      onReload={() => void billOfMaterialsQuery.refetch()}
      onSaved={() => {}}
    />
  )
}
