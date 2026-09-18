import type { BillOfMaterialsReference } from '@guardiola-foundry/shared-types'

type CandidateEligibility =
  | { selectable: true; outcome: 'eligible'; existingImplementation: null }
  | {
      selectable: false
      outcome: 'implementation-exists'
      existingImplementation: BillOfMaterialsReference
    }
  | {
      selectable: false
      outcome: 'product-unavailable' | 'variant-inactive'
      existingImplementation: null
    }

type CandidateState = {
  productStatus: 'active' | 'inactive'
  variantStatus: 'active' | 'inactive'
  existingImplementation: { id: string; name: string } | null
}

export function evaluateImplementationCandidate(state: CandidateState): CandidateEligibility {
  if (state.existingImplementation !== null) {
    return {
      selectable: false,
      outcome: 'implementation-exists',
      existingImplementation: state.existingImplementation,
    }
  }
  if (!isProductAvailable(state.productStatus)) {
    return {
      selectable: false,
      outcome: 'product-unavailable',
      existingImplementation: null,
    }
  }
  if (!isProductVariantAvailable(state.variantStatus)) {
    return {
      selectable: false,
      outcome: 'variant-inactive',
      existingImplementation: null,
    }
  }
  return {
    selectable: true,
    outcome: 'eligible',
    existingImplementation: null,
  }
}

export function isProductAvailable(status: 'active' | 'inactive') {
  return status === 'active'
}

export function isProductVariantAvailable(status: 'active' | 'inactive') {
  return status === 'active'
}
