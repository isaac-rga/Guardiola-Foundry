import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import {
  useBillOfMaterials,
  useProductVariantCandidates,
} from './api/bills-of-materials'
import { BomBuilderPage } from './create-bom-template-page'

export function ApplyTemplateBuilder({
  onExit,
  productVariantId,
  templateId,
}: {
  onExit: () => void
  productVariantId: string
  templateId: string
}) {
  const { session } = useAppShell()
  const template = useBillOfMaterials(session.token, templateId)
  const candidates = useProductVariantCandidates(
    session.token,
    productVariantId,
    templateId,
  )
  const candidate = candidates.data?.items.find(
    (item) => item.id === productVariantId,
  )

  if (template.isLoading || candidates.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading Template application...
      </p>
    )
  }
  if (
    template.error ||
    candidates.error ||
    !template.data ||
    !candidate ||
    !candidate.selectable
  ) {
    return (
      <div className="space-y-4">
        <p role="alert">
          {template.error?.message ??
            candidates.error?.message ??
            'Template application details are unavailable.'}
        </p>
        <Button onClick={onExit} type="button" variant="link">
          Back to catalog
        </Button>
      </div>
    )
  }

  return (
    <BomBuilderPage
      context={{
        kind: 'implementation',
        productVariant: candidate,
        sourceTemplate: template.data,
      }}
      onCancel={onExit}
      onSaved={onExit}
    />
  )
}
