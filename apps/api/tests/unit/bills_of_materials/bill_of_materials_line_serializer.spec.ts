import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import { serializeBillOfMaterialsLine } from '#modules/bills_of_materials/services/bill_of_materials_line_serializer'
import { test } from '@japa/runner'

test.group('Bill of Materials line serializer', () => {
  test('retains stable reference IDs when detail relations are unavailable', ({ assert }) => {
    const line = new BillOfMaterialLine()
    line.merge({
      publicId: 'BML-MISSNG',
      constructionPiece: 'Outer skirt',
      materialId: 41,
      materialQuantity: 3.125,
      patternSetId: 73,
      lineNote: null,
      displayOrder: 0,
      verifiedAt: null,
    })

    const serialized = serializeBillOfMaterialsLine(
      line,
      { amountCents: null, exclusionReason: 'no-usable-landed-unit-cost' },
      {
        material: new Map([[41, 'M-0041']]),
        patternSet: new Map([[73, 'PS-MISSNG']]),
      }
    )

    assert.deepInclude(serialized, {
      materialId: 'M-0041',
      material: null,
      patternSetId: 'PS-MISSNG',
      patternSet: null,
      attention: [],
    })
  })
})
