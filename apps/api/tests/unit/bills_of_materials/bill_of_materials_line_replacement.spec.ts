import {
  BillOfMaterialsUpdateValidationError,
  planBillOfMaterialsLineReplacement,
} from '#modules/bills_of_materials/domain/bill_of_materials_line_replacement'
import { test } from '@japa/runner'
import type { UpdateBillOfMaterialsLineRequest } from '@guardiola-foundry/shared-types'

const existingLine = {
  publicId: 'BML-ABC234',
  constructionPiece: 'Outer skirt',
  materialId: 1,
  materialQuantity: 3.125,
  patternSetId: 10,
  verified: true,
}

const requestedLine: UpdateBillOfMaterialsLineRequest = {
  id: existingLine.publicId,
  constructionPiece: existingLine.constructionPiece,
  materialId: 'M-0001',
  materialQuantity: existingLine.materialQuantity,
  patternSetId: 'PS-ABC234',
  lineNote: null,
  verified: true,
}

test.group('Bill of Materials Line replacement policy', () => {
  test('rejects a line identity that is not owned by the aggregate', ({ assert }) => {
    try {
      planBillOfMaterialsLineReplacement(
        [{ ...requestedLine, id: 'BML-XYZ234' }],
        [existingLine],
        new Map(),
        new Map()
      )
      assert.fail('Expected the foreign line identity to be rejected.')
    } catch (error) {
      assert.instanceOf(error, BillOfMaterialsUpdateValidationError)
      assert.equal((error as BillOfMaterialsUpdateValidationError).field, 'lines.0.id')
    }
  })

  test('allows unavailable references only when the existing line retains them', ({ assert }) => {
    const plan = planBillOfMaterialsLineReplacement(
      [requestedLine],
      [existingLine],
      new Map([['M-0001', { databaseId: 1, available: false }]]),
      new Map([['PS-ABC234', { databaseId: 10, available: false }]])
    )

    assert.equal(plan.lines[0].materialDatabaseId, 1)
    assert.equal(plan.lines[0].patternSetDatabaseId, 10)
    assert.isTrue(plan.lines[0].preserveVerification)
  })

  test('requires new verification evidence when construction facts change', ({ assert }) => {
    const plan = planBillOfMaterialsLineReplacement(
      [{ ...requestedLine, materialQuantity: 3.5 }],
      [existingLine],
      new Map([['M-0001', { databaseId: 1, available: true }]]),
      new Map([['PS-ABC234', { databaseId: 10, available: true }]])
    )

    assert.isFalse(plan.lines[0].preserveVerification)
  })
})
