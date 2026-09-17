import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BillsOfMaterialsWorkflow } from '@/features/bills-of-materials/bills-of-materials-workflow'
import { clearAuthSession } from '@/lib/auth/session-storage'

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: z.object({
    screen: z.enum(['builder', 'catalog']).optional().catch('catalog'),
    kind: z.enum(['template', 'implementation']).optional().catch('template'),
    productVariantId: z.string().optional(),
    billOfMaterialsId: z.string().optional(),
    templateId: z.string().optional(),
    derivationOriginId: z.string().optional(),
    search: z.string().max(200).optional(),
    catalogKind: z.enum(['template', 'implementation']).optional(),
    includeDeleted: z.boolean().optional().catch(false),
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
    derivationOriginId,
    search,
    catalogKind,
    includeDeleted,
  } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <BillsOfMaterialsWorkflow
      billOfMaterialsId={billOfMaterialsId}
      derivationOriginId={derivationOriginId}
      filters={{ search, kind: catalogKind, includeDeleted }}
      kind={kind}
      productVariantId={productVariantId}
      screen={screen}
      templateId={templateId}
      onAuthenticationFailure={() => {
        clearAuthSession()
        void navigate({ to: '/sign-in' })
      }}
      onExitBuilder={() =>
        void navigate({
          search: { screen: 'catalog' },
          replace: true,
          resetScroll: false,
        })
      }
      onFiltersChange={(changes) =>
        void navigate({
          search: (previous) => ({
            ...previous,
            search: changes.search,
            catalogKind: changes.kind,
            includeDeleted: changes.includeDeleted,
          }),
          replace: true,
          resetScroll: false,
        })
      }
      onEdit={(billOfMaterialsId) =>
        void navigate({
          search: {
            screen: 'builder',
            billOfMaterialsId,
          },
          resetScroll: true,
        })
      }
      onMissingImplementationContext={() =>
        void navigate({
          search: { screen: 'catalog' },
          replace: true,
          resetScroll: false,
        })
      }
      onOpenImplementationBuilder={(
        selectedProductVariantId,
        selectedTemplateId,
      ) => {
        void navigate({
          search: {
            screen: 'builder',
            kind: 'implementation',
            productVariantId: selectedProductVariantId,
            templateId: selectedTemplateId,
          },
          resetScroll: true,
        })
      }}
      onOpenDerivationBuilder={(selectedDerivationOriginId) =>
        void navigate({
          search: {
            screen: 'builder',
            kind: 'template',
            derivationOriginId: selectedDerivationOriginId,
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
