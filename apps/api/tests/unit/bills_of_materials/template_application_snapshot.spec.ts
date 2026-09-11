import { deriveTemplateApplicationSnapshot } from '#modules/bills_of_materials/services/template_application_snapshot'
import { test } from '@japa/runner'

test.group('Template application snapshot', () => {
  test('copies only construction values in source order and resets verification', ({ assert }) => {
    const snapshot = deriveTemplateApplicationSnapshot({
      description: 'Reusable construction',
      lines: [
        {
          constructionPiece: 'Outer skirt',
          materialId: 12,
          materialQuantity: 3.125,
          patternSetId: 24,
          lineNote: 'Cut on grain',
          displayOrder: 0,
        },
        {
          constructionPiece: 'Lining',
          materialId: null,
          materialQuantity: null,
          patternSetId: null,
          lineNote: null,
          displayOrder: 1,
        },
      ],
    })

    assert.deepEqual(snapshot, {
      description: 'Reusable construction',
      lines: [
        {
          constructionPiece: 'Outer skirt',
          materialId: 12,
          materialQuantity: 3.125,
          patternSetId: 24,
          lineNote: 'Cut on grain',
          displayOrder: 0,
          verifiedByUserId: null,
          verifiedAt: null,
        },
        {
          constructionPiece: 'Lining',
          materialId: null,
          materialQuantity: null,
          patternSetId: null,
          lineNote: null,
          displayOrder: 1,
          verifiedByUserId: null,
          verifiedAt: null,
        },
      ],
    })
  })
})
