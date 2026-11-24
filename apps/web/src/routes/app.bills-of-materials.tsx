import {
  createFileRoute,
  defaultStringifySearch,
  redirect,
} from '@tanstack/react-router'
import { listBillsOfMaterialsQuerySchema } from '@guardiola-foundry/shared-validation'
import { z } from 'zod'

import { BillsOfMaterialsWorkflow } from '@/features/bills-of-materials/bills-of-materials-workflow'

const billsOfMaterialsSearchSchema = z.object({
  screen: z
    .enum(['builder', 'catalog'])
    .optional()
    .catch(undefined)
    .transform((value) => (value === 'catalog' ? undefined : value)),
  kind: z.enum(['template', 'implementation']).optional().catch(undefined),
  productVariantId: z.string().optional(),
  billOfMaterialsId: z.string().optional(),
  templateId: z.string().optional(),
  derivationOriginId: z.string().optional(),
  search: z
    .string()
    .trim()
    .pipe(listBillsOfMaterialsQuerySchema.shape.search.unwrap())
    .optional()
    .catch(undefined),
  catalogKind: listBillsOfMaterialsQuerySchema.shape.kind.catch(undefined),
  includeDeleted: listBillsOfMaterialsQuerySchema.shape.includeDeleted
    .catch(undefined)
    .transform((value) => value || undefined),
})

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: billsOfMaterialsSearchSchema,
  beforeLoad: ({ location, search }) => {
    const canonical = billsOfMaterialsSearchSchema.parse(search)
    if (
      defaultStringifySearch(
        Object.fromEntries(Object.entries(canonical).sort()),
      ) !==
      defaultStringifySearch(
        Object.fromEntries(Object.entries(location.search).sort()),
      )
    ) {
      throw redirect({
        to: location.pathname,
        search: canonical,
        hash: location.hash,
        replace: true,
      })
    }
  },
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
      onExitBuilder={() =>
        void navigate({
          search: { screen: 'catalog' },
          replace: true,
          resetScroll: false,
        })
      }
      onFiltersChange={(changes, options) =>
        void navigate({
          search: (previous) => ({
            ...previous,
            ...('search' in changes ? { search: changes.search } : {}),
            ...('kind' in changes ? { catalogKind: changes.kind } : {}),
            ...('includeDeleted' in changes
              ? { includeDeleted: changes.includeDeleted }
              : {}),
          }),
          replace: options?.replace ?? false,
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
