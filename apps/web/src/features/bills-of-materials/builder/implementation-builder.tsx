import type { ProductVariantCandidate } from '@guardiola-foundry/shared-types'

import { BomBuilderPage } from './bom-builder-page'

export function ImplementationBuilder({
  onExit,
  productVariant,
}: {
  onExit: () => void
  productVariant: Pick<ProductVariantCandidate, 'id' | 'name' | 'product'>
}) {
  return (
    <BomBuilderPage
      context={{ kind: 'implementation', productVariant }}
      onCancel={onExit}
      onSaved={onExit}
    />
  )
}
