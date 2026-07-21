import type {
  ImportedMaterialRow,
  ImportedMaterialSourceRow,
} from '#modules/materials/materials_importer'

export const MATERIAL_SOURCE_IMPORT_FIXTURE: ImportedMaterialSourceRow[] = [
  {
    legacySourceId: 'SRC-100',
    name: 'Italian Silk Crepe',
    provider: 'Casa Tessile',
    textileFamily: 'crepe',
    purchaseUnit: 'yard',
    normalizedUnitCostCents: 4200,
  },
  {
    legacySourceId: 'SRC-101',
    name: 'Ivory Crepe Backup',
    provider: 'Milan Textiles',
    textileFamily: 'crepe',
    purchaseUnit: 'meter',
    normalizedUnitCostCents: 3900,
  },
  {
    legacySourceId: 'SRC-200',
    name: 'Champagne Structure Satin',
    provider: 'Atelier Supply',
    textileFamily: 'satin',
    purchaseUnit: 'roll',
    normalizedUnitCostCents: 2800,
  },
  {
    legacySourceId: 'SRC-300',
    name: 'White Chantilly Lace',
    provider: 'Dentelle House',
    textileFamily: 'lace',
    purchaseUnit: 'yard',
    normalizedUnitCostCents: 7600,
  },
]

export const MATERIAL_IMPORT_FIXTURE: ImportedMaterialRow[] = [
  {
    legacyMaterialId: 'MAT-001',
    name: 'Ivory Silk Crepe',
    materialColor: 'ivory',
    materialUse: 'base-fabric',
    comments: 'Primary dress fabric from the spreadsheet import.',
    legacySourceIds: ['SRC-100', 'SRC-101'],
  },
  {
    legacyMaterialId: 'MAT-002',
    name: 'Champagne Structure Satin',
    materialColor: 'champagne',
    materialUse: 'structure',
    comments: null,
    legacySourceIds: ['SRC-200'],
  },
  {
    legacyMaterialId: 'MAT-003',
    name: 'White Chantilly Lace',
    materialColor: 'white',
    materialUse: 'lace',
    comments: 'Keep compact in the first Materials table.',
    legacySourceIds: ['SRC-300'],
  },
  {
    legacyMaterialId: 'MAT-999',
    name: 'Unresolved Spreadsheet Material',
    materialColor: 'ivory',
    materialUse: 'base-fabric',
    comments: 'Skipped until the missing source reference is cleaned up.',
    legacySourceIds: ['SRC-MISSING'],
  },
]
