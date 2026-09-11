import { createFileRoute, Navigate } from '@tanstack/react-router'
import { z } from 'zod'

import { BillsOfMaterialsCatalogPage } from '@/features/bills-of-materials/bills-of-materials-catalog-page'
import { BomBuilderPage } from '@/features/bills-of-materials/create-bom-template-page'
import { ImplementationBuilder } from '@/features/bills-of-materials/implementation-builder'
import { ExistingBomBuilder } from '@/features/bills-of-materials/existing-bom-builder'
import { ApplyTemplateBuilder } from '@/features/bills-of-materials/apply-template-builder'

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: z.object({
    screen: z.enum(['builder', 'catalog']).optional().catch('catalog'),
    kind: z.enum(['template', 'implementation']).optional().catch('template'),
    productVariantId: z.string().optional(),
    billOfMaterialsId: z.string().optional(),
    templateId: z.string().optional(),
  }),
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  const {
    kind = 'template',
    productVariantId,
    screen = 'catalog',
    billOfMaterialsId,
    templateId,
  } = Route.useSearch()
  const navigate = Route.useNavigate()

  if (screen === 'builder') {
    if (billOfMaterialsId) {
      return (
        <ExistingBomBuilder
          billOfMaterialsId={billOfMaterialsId}
          onExit={() =>
            void navigate({
              search: { screen: 'catalog' },
              replace: true,
              resetScroll: false,
            })
          }
        />
      )
    }
    if (kind === 'implementation') {
      if (!productVariantId) {
        return (
          <Navigate
            replace
            search={{ screen: 'catalog' }}
            to="/app/bills-of-materials"
          />
        )
      }
      if (templateId) {
        return (
          <ApplyTemplateBuilder
            productVariantId={productVariantId}
            templateId={templateId}
            onExit={() =>
              void navigate({
                search: { screen: 'catalog' },
                replace: true,
                resetScroll: false,
              })
            }
          />
        )
      }
      return (
        <ImplementationBuilder
          productVariantId={productVariantId}
          onExit={() =>
            void navigate({
              search: { screen: 'catalog' },
              replace: true,
              resetScroll: false,
            })
          }
        />
      )
    }
    return (
      <BomBuilderPage
        context={{ kind: 'template' }}
        onCancel={() =>
          void navigate({
            search: { screen: 'catalog' },
            replace: true,
            resetScroll: false,
          })
        }
        onSaved={() =>
          void navigate({
            search: { screen: 'catalog' },
            replace: true,
            resetScroll: false,
          })
        }
      />
    )
  }

  return (
    <BillsOfMaterialsCatalogPage
      onEdit={(billOfMaterialsId) =>
        void navigate({
          search: {
            screen: 'builder',
            billOfMaterialsId,
          },
          resetScroll: true,
        })
      }
      onCreateImplementation={(candidate) =>
        void navigate({
          search: {
            screen: 'builder',
            kind: 'implementation',
            productVariantId: candidate.id,
          },
          resetScroll: true,
        })
      }
      onApplyTemplate={(templateId, candidate) =>
        void navigate({
          search: {
            screen: 'builder',
            kind: 'implementation',
            productVariantId: candidate.id,
            templateId,
          },
          resetScroll: true,
        })
      }
      onCreateTemplate={() =>
        void navigate({
          search: (previous) => ({
            ...previous,
            screen: 'builder',
            kind: 'template',
            productVariantId: undefined,
          }),
          resetScroll: true,
        })
      }
    />
  )
}
