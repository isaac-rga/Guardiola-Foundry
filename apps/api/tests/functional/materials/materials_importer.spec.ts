import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import AdoptStableSourceIdentity from '#database/migrations/1786680000000_adopt_stable_source_identity'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import { test } from '@japa/runner'

test.group('Materials importer', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
  })

  test('migrates provisional Source IDs and continues the stable sequence', async ({ assert }) => {
    await new AdoptStableSourceIdentity(db.connection(), 'adopt_stable_source_identity').execDown()

    await db
      .table('material_sources')
      .multiInsert([
        legacySourceRecord('MS-0099', 'SRC-FIRST'),
        legacySourceRecord('MS-0001', 'SRC-SECOND'),
      ])

    await new AdoptStableSourceIdentity(db.connection(), 'adopt_stable_source_identity').execUp()

    const migratedSources = await db
      .from('material_sources')
      .select(['public_id', 'legacy_source_id'])
      .orderBy('id', 'asc')
    const [appCreatedSource] = await db
      .table('material_sources')
      .insert(legacySourceRecord(undefined, null))
      .returning(['public_id', 'legacy_source_id'])

    assert.deepEqual(migratedSources, [
      { public_id: 'S-0001', legacy_source_id: 'SRC-FIRST' },
      { public_id: 'S-0002', legacy_source_id: 'SRC-SECOND' },
    ])
    assert.deepEqual(appCreatedSource, {
      public_id: 'S-0003',
      legacy_source_id: null,
    })
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
        { publicId: 'S-0001', legacySourceId: 'SRC-100' },
        { publicId: 'S-0002', legacySourceId: 'SRC-101' },
        { publicId: 'S-0003', legacySourceId: 'SRC-200' },
        { publicId: 'S-0004', legacySourceId: 'SRC-300' },
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
    assert.equal(source.publicId, 'S-0001')
    assert.equal(source.provider, 'Casa Tessile Updated')
    assert.equal(source.normalizedUnitCostCents, 4500)
  })

  test('keeps Source IDs stable when import rows are reordered and allocates the next ID', async ({
    assert,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)

    const reorderedSources = [
      MATERIAL_SOURCE_IMPORT_FIXTURE[3],
      MATERIAL_SOURCE_IMPORT_FIXTURE[1],
      MATERIAL_SOURCE_IMPORT_FIXTURE[0],
      MATERIAL_SOURCE_IMPORT_FIXTURE[2],
      {
        legacySourceId: 'SRC-400',
        name: 'New Organza Source',
        provider: 'Organza House',
        textileFamily: 'organza',
        purchaseUnit: 'meter',
        normalizedUnitCostCents: 5100,
      },
    ]

    await importMaterialsFromRows(reorderedSources, MATERIAL_IMPORT_FIXTURE)

    const sources = await MaterialSource.query().orderBy('legacySourceId', 'asc')

    assert.deepEqual(
      sources.map((source) => ({
        legacySourceId: source.legacySourceId,
        publicId: source.publicId,
      })),
      [
        { legacySourceId: 'SRC-100', publicId: 'S-0001' },
        { legacySourceId: 'SRC-101', publicId: 'S-0002' },
        { legacySourceId: 'SRC-200', publicId: 'S-0003' },
        { legacySourceId: 'SRC-300', publicId: 'S-0004' },
        { legacySourceId: 'SRC-400', publicId: 'S-0005' },
      ]
    )
  })

  test('allows an app-created Source to receive legacy provenance once', async ({ assert }) => {
    const [createdSource] = await db
      .table('material_sources')
      .insert({
        legacy_source_id: null,
        name: 'App-created Source',
        provider: 'Local Vendor',
        textile_family: 'crepe',
        purchase_unit: 'meter',
        normalized_unit_cost_cents: 2500,
        normalized_unit: 'meter',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['public_id', 'legacy_source_id'])

    assert.equal(createdSource.public_id, 'S-0001')
    assert.isNull(createdSource.legacy_source_id)

    const [reconciledSource] = await db
      .from('material_sources')
      .where('public_id', createdSource.public_id)
      .update({ legacy_source_id: 'SRC-LATE' })
      .returning(['public_id', 'legacy_source_id'])

    assert.deepEqual(reconciledSource, {
      public_id: 'S-0001',
      legacy_source_id: 'SRC-LATE',
    })
    await assert.rejects(
      () =>
        db
          .from('material_sources')
          .where('public_id', createdSource.public_id)
          .update({ legacy_source_id: 'SRC-REPLACEMENT' }),
      /Source identity fields are immutable/
    )
  })

  test('keeps the app-owned Source ID immutable', async ({ assert }) => {
    const [createdSource] = await db
      .table('material_sources')
      .insert(legacySourceRecord(undefined, null))
      .returning(['public_id'])

    await assert.rejects(
      () =>
        db
          .from('material_sources')
          .where('public_id', createdSource.public_id)
          .update({ public_id: 'S-9999' }),
      /Source identity fields are immutable/
    )
  })

  test('enforces unique Material links and one Preferred Source per Material', async ({
    assert,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)

    const material = await Material.findByOrFail('publicId', 'M-0001')
    const links = await MaterialSourceLink.query()
      .where('materialId', material.id)
      .orderBy('sortOrder', 'asc')

    await assert.rejects(
      () =>
        MaterialSourceLink.create({
          materialId: material.id,
          materialSourceId: links[0].materialSourceId,
          sortOrder: 3,
          isPreferred: false,
        }),
      /duplicate key value/
    )
    await assert.rejects(async () => {
      links[1].isPreferred = true
      await links[1].save()
    }, /duplicate key value/)
  })

  test('reconciles soft-deleted Materials and Sources without creating duplicate public IDs', async ({
    assert,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)

    const material = await Material.findByOrFail('publicId', 'M-0001')
    const source = await MaterialSource.findByOrFail('publicId', 'S-0001')

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
    assert.equal(reconciledSource.publicId, 'S-0001')
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
  await db.rawQuery('ALTER SEQUENCE material_source_public_id_seq RESTART WITH 1')
}

function legacySourceRecord(publicId: string | undefined, legacySourceId: string | null) {
  return {
    ...(publicId ? { public_id: publicId } : {}),
    legacy_source_id: legacySourceId,
    name: legacySourceId ?? 'App-created Source',
    provider: 'Migration Test Vendor',
    textile_family: 'crepe',
    purchase_unit: 'meter',
    normalized_unit_cost_cents: 2500,
    normalized_unit: 'meter',
    created_at: new Date(),
    updated_at: new Date(),
  }
}
