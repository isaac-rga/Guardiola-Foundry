import { describe, expect, it } from 'vitest'

import {
  isCompleteBillOfMaterialsLine,
  resolveBillOfMaterialsLineVerification,
} from './bom-line-verification'

const verifiedLine = {
  constructionPiece: 'Outer skirt',
  materialId: 'M-0001',
  materialQuantity: 3.125,
  lineNote: null,
  verified: true,
}

describe('BOM Line Verification', () => {
  it('allows manual verification only while the line is Complete', () => {
    expect(isCompleteBillOfMaterialsLine(verifiedLine)).toBe(true)
    expect(
      resolveBillOfMaterialsLineVerification(verifiedLine, {
        verified: false,
      }),
    ).toBe(false)
    expect(
      resolveBillOfMaterialsLineVerification(
        { ...verifiedLine, materialQuantity: null, verified: false },
        { verified: true },
      ),
    ).toBe(false)
  })

  it('resets reviewed construction facts and preserves unrelated changes', () => {
    expect(
      resolveBillOfMaterialsLineVerification(verifiedLine, {
        constructionPiece: 'Outer overskirt',
      }),
    ).toBe(false)
    expect(
      resolveBillOfMaterialsLineVerification(verifiedLine, {
        materialId: 'M-0002',
      }),
    ).toBe(false)
    expect(
      resolveBillOfMaterialsLineVerification(verifiedLine, {
        materialQuantity: 3.25,
      }),
    ).toBe(false)
    expect(
      resolveBillOfMaterialsLineVerification(verifiedLine, {
        lineNote: 'Cut on grain',
      }),
    ).toBe(true)
    expect(
      resolveBillOfMaterialsLineVerification(verifiedLine, {
        constructionPiece: '  Outer skirt  ',
      }),
    ).toBe(true)
  })
})
