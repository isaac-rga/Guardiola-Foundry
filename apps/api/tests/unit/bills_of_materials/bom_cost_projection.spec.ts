import { calculateBomCostProjection } from '@guardiola-foundry/bom-cost-projection'
import { test } from '@japa/runner'

test.group('BOM cost projection', () => {
  test('rounds each repeated Material occurrence before summing the Complete projection', ({
    assert,
  }) => {
    const projection = calculateBomCostProjection([
      {
        hasMaterial: true,
        materialQuantity: 1.111,
        landedUnitCostCents: 101,
        sourceUsable: true,
      },
      {
        hasMaterial: true,
        materialQuantity: 1.111,
        landedUnitCostCents: 101,
        sourceUsable: true,
      },
    ])

    assert.deepEqual(projection, {
      lines: [
        { amountCents: 112, exclusionReason: null },
        { amountCents: 112, exclusionReason: null },
      ],
      summary: {
        availability: 'complete',
        amountCents: 224,
        excludedLineCount: 0,
      },
    })
  })

  test('treats explicit zero as calculable and reports each exclusion independently', ({
    assert,
  }) => {
    const projection = calculateBomCostProjection([
      {
        hasMaterial: true,
        materialQuantity: 2.5,
        landedUnitCostCents: 0,
        sourceUsable: true,
      },
      {
        hasMaterial: false,
        materialQuantity: null,
        landedUnitCostCents: null,
        sourceUsable: false,
      },
      {
        hasMaterial: true,
        materialQuantity: null,
        landedUnitCostCents: 4200,
        sourceUsable: true,
      },
      {
        hasMaterial: true,
        materialQuantity: 1,
        landedUnitCostCents: null,
        sourceUsable: false,
      },
    ])

    assert.deepEqual(projection, {
      lines: [
        { amountCents: 0, exclusionReason: null },
        { amountCents: null, exclusionReason: 'missing-material' },
        { amountCents: null, exclusionReason: 'missing-material-quantity' },
        {
          amountCents: null,
          exclusionReason: 'no-usable-landed-unit-cost',
        },
      ],
      summary: {
        availability: 'partial',
        amountCents: 0,
        excludedLineCount: 3,
      },
    })
  })

  test('returns Unavailable rather than zero when no line is calculable', ({ assert }) => {
    const noLines = calculateBomCostProjection([])
    const excludedLines = calculateBomCostProjection([
      {
        hasMaterial: true,
        materialQuantity: 1,
        landedUnitCostCents: null,
        sourceUsable: false,
      },
    ])

    assert.deepEqual(noLines.summary, {
      availability: 'unavailable',
      amountCents: null,
      excludedLineCount: 0,
    })
    assert.deepEqual(excludedLines.summary, {
      availability: 'unavailable',
      amountCents: null,
      excludedLineCount: 1,
    })
  })
})
