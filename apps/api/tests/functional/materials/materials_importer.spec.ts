import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import { test } from '@japa/runner'

test.group('Materials importer', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
  })

  test('imports valid Materials and Sources while skipping unresolved Source links', async ({
    assert,
  }) => {
    const result = await importMaterialsFromRows(
      MATERIAL_SOURCE_IMPORT_FIXTURE,
      MATERIAL_IMPORT_FIXTURE
    )

    assert.deepEqual(result, {
      importedCount: 3,
      skippedCount: 1,
    })

    const materials = await Material.query().orderBy('publicId', 'asc')
    const sources = await MaterialSource.query().orderBy('publicId', 'asc')

    assert.deepEqual(
      materials.map((material) => ({
        publicId: material.publicId,
        legacyMaterialId: material.legacyMaterialId,
      })),
      [
        { publicId: 'M-0001', legacyMaterialId: 'MAT-001' },
        { publicId: 'M-0002', legacyMaterialId: 'MAT-002' },
        { publicId: 'M-0003', legacyMaterialId: 'MAT-003' },
      ]
    )
    assert.notInclude(
      materials.map((material) => material.legacyMaterialId),
      'MAT-999'
    )
    assert.deepEqual(
      sources.map((source) => ({
        publicId: source.publicId,
        legacySourceId: source.legacySourceId,
      })),
      [
        { publicId: 'MS-0001', legacySourceId: 'SRC-100' },
        { publicId: 'MS-0002', legacySourceId: 'SRC-101' },
        { publicId: 'MS-0003', legacySourceId: 'SRC-200' },
        { publicId: 'MS-0004', legacySourceId: 'SRC-300' },
      ]
    )
  })

  test('marks the first linked Source as preferred and keeps later Sources as alternates', async ({
    assert,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)

    const material = await Material.query()
      .where('publicId', 'M-0001')
      .preload('sourceLinks', (sourceLinkQuery) => {
        sourceLinkQuery.preload('materialSource').orderBy('sortOrder', 'asc')
      })
      .firstOrFail()

    assert.deepEqual(
      material.sourceLinks.map((sourceLink) => ({
        legacySourceId: sourceLink.materialSource.legacySourceId,
        isPreferred: sourceLink.isPreferred,
        sortOrder: sourceLink.sortOrder,
      })),
      [
        { legacySourceId: 'SRC-100', isPreferred: true, sortOrder: 1 },
        { legacySourceId: 'SRC-101', isPreferred: false, sortOrder: 2 },
      ]
    )
  })

  test('can be rerun without duplicating Materials, Sources, or links', async ({ assert }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const result = await importMaterialsFromRows(
      MATERIAL_SOURCE_IMPORT_FIXTURE,
      MATERIAL_IMPORT_FIXTURE
    )

    assert.deepEqual(result, {
      importedCount: 3,
      skippedCount: 1,
    })
    assert.equal(await Material.query().count('* as total').first().then(countTotal), 3)
    assert.equal(await MaterialSource.query().count('* as total').first().then(countTotal), 4)
    assert.equal(await MaterialSourceLink.query().count('* as total').first().then(countTotal), 4)
  })

  test('refreshes existing rows when imported fixture values change', async ({ assert }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)

    const refreshedMaterials = MATERIAL_IMPORT_FIXTURE.map((materialRow) =>
      materialRow.legacyMaterialId === 'MAT-001'
        ? {
            ...materialRow,
            name: 'Refreshed Ivory Silk Crepe',
            comments: 'Updated from refreshed spreadsheet data.',
          }
        : materialRow
    )
    const refreshedSources = MATERIAL_SOURCE_IMPORT_FIXTURE.map((sourceRow) =>
      sourceRow.legacySourceId === 'SRC-100'
        ? {
            ...sourceRow,
            provider: 'Casa Tessile Updated',
            normalizedUnitCostCents: 4500,
          }
        : sourceRow
    )

    await importMaterialsFromRows(refreshedSources, refreshedMaterials)

    const material = await Material.findByOrFail('legacyMaterialId', 'MAT-001')
    const source = await MaterialSource.findByOrFail('legacySourceId', 'SRC-100')

    assert.equal(material.publicId, 'M-0001')
    assert.equal(material.name, 'Refreshed Ivory Silk Crepe')
    assert.equal(material.comments, 'Updated from refreshed spreadsheet data.')
    assert.equal(source.publicId, 'MS-0001')
    assert.equal(source.provider, 'Casa Tessile Updated')
    assert.equal(source.normalizedUnitCostCents, 4500)
  })

  test('reconciles soft-deleted Materials and Sources without creating duplicate public IDs', async ({
    assert,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)

    const material = await Material.findByOrFail('publicId', 'M-0001')
    const source = await MaterialSource.findByOrFail('publicId', 'MS-0001')

    await material.softDelete()
    await source.softDelete()

    const result = await importMaterialsFromRows(
      MATERIAL_SOURCE_IMPORT_FIXTURE,
      MATERIAL_IMPORT_FIXTURE
    )
    const reconciledMaterial = await Material.queryWithDeleted()
      .where('legacyMaterialId', 'MAT-001')
      .firstOrFail()
    const reconciledSource = await MaterialSource.queryWithDeleted()
      .where('legacySourceId', 'SRC-100')
      .firstOrFail()

    assert.deepEqual(result, {
      importedCount: 3,
      skippedCount: 1,
    })
    assert.equal(reconciledMaterial.publicId, 'M-0001')
    assert.equal(reconciledSource.publicId, 'MS-0001')
    assert.isNotNull(reconciledMaterial.deletedAt)
    assert.isNotNull(reconciledSource.deletedAt)
    assert.equal(await Material.queryWithDeleted().count('* as total').first().then(countTotal), 3)
    assert.equal(
      await MaterialSource.queryWithDeleted().count('* as total').first().then(countTotal),
      4
    )
  })
})

function countTotal(row: { $extras: { total?: string | number } } | null) {
  return Number(row?.$extras.total ?? 0)
}

async function clearMaterialsData() {
  await db.from('material_source_links').delete()
  await db.from('materials').delete()
  await db.from('material_sources').delete()
}
