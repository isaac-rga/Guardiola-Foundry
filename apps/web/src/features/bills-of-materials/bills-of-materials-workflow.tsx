import { useEffect, useState } from 'react'
import type {
  ListBillsOfMaterialsQuery,
  ProductVariantCandidate,
} from '@guardiola-foundry/shared-types'

import { ApplyTemplateBuilder } from './builder/apply-template-builder'
import { BillsOfMaterialsCatalogPage } from './bills-of-materials-catalog-page'
import { BomBuilderPage } from './builder/bom-builder-page'
import { DeriveTemplateBuilder } from './builder/derive-template-builder'
import { ExistingBomBuilder } from './builder/existing-bom-builder'
import { ImplementationBuilder } from './builder/implementation-builder'

type SelectedImplementationContext = {
  productVariant: Pick<ProductVariantCandidate, 'id' | 'name' | 'product'>
  templateId?: string
}

export function BillsOfMaterialsWorkflow({
  billOfMaterialsId,
  derivationOriginId,
  filters,
  kind,
  onAuthenticationFailure,
  onCreateTemplate,
  onEdit,
  onExitBuilder,
  onFiltersChange,
  onMissingImplementationContext,
  onOpenDerivationBuilder,
  onOpenImplementationBuilder,
  screen,
  templateId,
  productVariantId,
}: {
  billOfMaterialsId?: string
  derivationOriginId?: string
  filters: ListBillsOfMaterialsQuery
  kind: 'template' | 'implementation'
  onAuthenticationFailure: () => void
  onCreateTemplate: () => void
  onEdit: (billOfMaterialsId: string) => void
  onExitBuilder: () => void
  onFiltersChange: (changes: ListBillsOfMaterialsQuery) => void
  onMissingImplementationContext: () => void
  onOpenDerivationBuilder: (originId: string) => void
  onOpenImplementationBuilder: (
    productVariantId: string,
    templateId?: string,
  ) => void
  productVariantId?: string
  screen: 'builder' | 'catalog'
  templateId?: string
}) {
  const [selectedImplementationContext, setSelectedImplementationContext] =
    useState<SelectedImplementationContext | null>(null)
  const isMissingImplementationContext =
    screen === 'builder' &&
    kind === 'implementation' &&
    !billOfMaterialsId &&
    (!productVariantId ||
      !selectedImplementationContext ||
      selectedImplementationContext.productVariant.id !== productVariantId ||
      selectedImplementationContext.templateId !== templateId)

  useEffect(() => {
    if (isMissingImplementationContext) onMissingImplementationContext()
  }, [isMissingImplementationContext, onMissingImplementationContext])

  const exitBuilder = () => {
    setSelectedImplementationContext(null)
    onExitBuilder()
  }

  if (screen === 'builder') {
    if (kind === 'template' && derivationOriginId) {
      return (
        <DeriveTemplateBuilder
          originId={derivationOriginId}
          onExit={onExitBuilder}
        />
      )
    }
    if (billOfMaterialsId) {
      return (
        <ExistingBomBuilder
          billOfMaterialsId={billOfMaterialsId}
          onExit={onExitBuilder}
        />
      )
    }
    if (kind === 'implementation') {
      if (isMissingImplementationContext || !selectedImplementationContext) {
        return null
      }
      if (templateId) {
        return (
          <ApplyTemplateBuilder
            productVariant={selectedImplementationContext.productVariant}
            templateId={templateId}
            onExit={exitBuilder}
          />
        )
      }
      return (
        <ImplementationBuilder
          productVariant={selectedImplementationContext.productVariant}
          onExit={exitBuilder}
        />
      )
    }
    return (
      <BomBuilderPage
        context={{ kind: 'template' }}
        onCancel={onExitBuilder}
        onSaved={onExitBuilder}
      />
    )
  }

  return (
    <BillsOfMaterialsCatalogPage
      filters={filters}
      onAuthenticationFailure={onAuthenticationFailure}
      onFiltersChange={onFiltersChange}
      onEdit={onEdit}
      onCreateImplementation={(candidate) => {
        setSelectedImplementationContext({ productVariant: candidate })
        onOpenImplementationBuilder(candidate.id)
      }}
      onApplyTemplate={(selectedTemplateId, candidate) => {
        setSelectedImplementationContext({
          productVariant: candidate,
          templateId: selectedTemplateId,
        })
        onOpenImplementationBuilder(candidate.id, selectedTemplateId)
      }}
      onDeriveTemplate={onOpenDerivationBuilder}
      onCreateTemplate={onCreateTemplate}
    />
  )
}
