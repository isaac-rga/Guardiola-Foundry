import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import type { ProductVariantCandidate } from '@guardiola-foundry/shared-types'

import { useBillOfMaterials } from '../api/bills-of-materials'
import { BomBuilderPage } from './bom-builder-page'

export function ApplyTemplateBuilder({
  onExit,
  productVariant,
  templateId,
}: {
  onExit: () => void
  productVariant: Pick<ProductVariantCandidate, 'id' | 'name' | 'product'>
  templateId: string
}) {
  const { session } = useAppShell()
  const template = useBillOfMaterials(session.token, templateId)

  if (template.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading Template application...
      </p>
    )
  }
  if (template.error || !template.data) {
    return (
      <div className="space-y-4">
        <p role="alert">
          {template.error?.message ??
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
        productVariant,
        sourceTemplate: template.data,
      }}
      onCancel={onExit}
      onSaved={onExit}
    />
  )
}
