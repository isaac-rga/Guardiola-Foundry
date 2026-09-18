export class ImplementationDestinationValidationError extends Error {}

export class ImplementationDestinationVariantConflictError extends Error {
  constructor(readonly conflictingImplementation: { id: string; name: string }) {
    super(`Product Variant already has ${conflictingImplementation.name}.`)
  }
}

export class ImplementationDestinationTypificationConflictError extends Error {
  constructor(readonly conflictingImplementation: { id: string; name: string }) {
    super('Another BOM Implementation in this Product already uses this typification.')
  }
}
