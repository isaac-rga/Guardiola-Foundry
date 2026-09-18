import { describe, expect, it } from 'vitest'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsLine,
} from '@guardiola-foundry/shared-types'

import {
  resolveBomBuilderDefaultValues,
  type BomBuilderContext,
} from './bom-builder-default-values'

const product = {
  id: 'P-ABC234',
  name: 'Celeste Gown',
  availability: 'available' as const,
}

const productVariant = {
  id: 'PV-ABC234',
  name: 'Celeste Gown · Sample',
  availability: 'available' as const,
}

const line: BillOfMaterialsLine = {
  id: 'BML-ABC234',
  constructionPiece: 'Outer skirt',
  materialId: 'M-0001',
  material: null,
  materialQuantity: 3.125,
  patternSetId: 'PS-ABC234',
  patternSet: null,
  lineNote: 'Cut on grain',
  order: 0,
  completeness: 'complete',
  verification: {
    status: 'verified',
    verifiedBy: { id: 1, email: 'operator@example.com' },
    verifiedAt: '2026-09-15T12:00:00.000Z',
  },
  attention: [],
  costProjection: { amountCents: 4200, exclusionReason: null },
}

function billOfMaterials(
  overrides: Partial<BillOfMaterialsDetail> = {},
): BillOfMaterialsDetail {
  return {
    id: 'BOM-ABC234',
    kind: 'template',
    name: 'Celeste Gown Template',
    description: 'Construction reference',
    product,
    productVariant: null,
    origin: null,
    deletedAt: null,
    descendantCount: 0,
    readOnlyReason: null,
    lineCount: 1,
    verifiedLineCount: 1,
    attentionCount: 0,
    costProjection: {
      availability: 'complete',
      amountCents: 4200,
      excludedLineCount: 0,
    },
    createdBy: { id: 1, email: 'operator@example.com' },
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z',
    lines: [line],
    ...overrides,
  }
}

describe('Bill of Materials Builder default values', () => {
  it('preserves existing Template values, retained IDs, and verification', () => {
    const existing = billOfMaterials()

    expect(
      resolveBomBuilderDefaultValues({
        context: { kind: 'template' },
        existing,
      }),
    ).toEqual({
      kind: 'template',
      name: 'Celeste Gown Template',
      description: 'Construction reference',
      productId: 'P-ABC234',
      lines: [
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 3.125,
          patternSetId: 'PS-ABC234',
          lineNote: 'Cut on grain',
          verified: true,
        },
      ],
    })
  })

  it('uses the existing Product Variant for an Implementation', () => {
    const existing = billOfMaterials({
      kind: 'implementation',
      productVariant,
    })

    expect(
      resolveBomBuilderDefaultValues({
        context: {
          kind: 'implementation',
          productVariant: {
            id: productVariant.id,
            name: productVariant.name,
            product,
          },
        },
        existing,
      }),
    ).toMatchObject({
      kind: 'implementation',
      productVariantId: 'PV-ABC234',
      lines: [{ verified: true }],
    })
  })

  it('creates an unverified Template copy with the source Product', () => {
    const sourceBillOfMaterials = billOfMaterials()
    const context: BomBuilderContext = {
      kind: 'template',
      sourceBillOfMaterials,
    }

    expect(resolveBomBuilderDefaultValues({ context })).toMatchObject({
      kind: 'template',
      name: 'Celeste Gown Template — copy',
      description: 'Construction reference',
      productId: 'P-ABC234',
      lines: [
        {
          materialId: 'M-0001',
          patternSetId: 'PS-ABC234',
          verified: false,
        },
      ],
    })
  })

  it('creates an unverified Implementation from its source Template', () => {
    const context: BomBuilderContext = {
      kind: 'implementation',
      productVariant: {
        id: productVariant.id,
        name: productVariant.name,
        product,
      },
      sourceTemplate: billOfMaterials(),
    }

    expect(resolveBomBuilderDefaultValues({ context })).toMatchObject({
      kind: 'implementation',
      name: '',
      description: 'Construction reference',
      productVariantId: 'PV-ABC234',
      lines: [
        {
          materialId: 'M-0001',
          patternSetId: 'PS-ABC234',
          verified: false,
        },
      ],
    })
  })

  it('creates empty Template values', () => {
    expect(
      resolveBomBuilderDefaultValues({ context: { kind: 'template' } }),
    ).toEqual({
      kind: 'template',
      name: '',
      description: null,
      productId: null,
      lines: [],
    })
  })

  it('creates empty Implementation values for its Product Variant', () => {
    expect(
      resolveBomBuilderDefaultValues({
        context: {
          kind: 'implementation',
          productVariant: {
            id: productVariant.id,
            name: productVariant.name,
            product,
          },
        },
      }),
    ).toEqual({
      kind: 'implementation',
      name: '',
      description: null,
      productVariantId: 'PV-ABC234',
      lines: [],
    })
  })
})
