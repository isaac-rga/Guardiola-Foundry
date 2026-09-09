import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import Material from '#models/material'
import User from '#models/user'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(async () => {
    await BillOfMaterial.query().delete()
    await testUtils.db('postgres_test').truncate()
  })

  test('starts with an empty persisted catalog', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBody({ billsOfMaterials: [] })
  })

  test('creates an unassociated Template with immutable creation metadata', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: '  Jackie base construction  ',
        description: '  Reusable starting point  ',
      })

    response.assertStatus(201)
    response.assertBodyContains({
      kind: 'template',
      name: 'Jackie base construction',
      description: 'Reusable starting point',
      createdBy: { id: session.userId, email: 'admin@example.com' },
    })
    assert.match(response.body().id, /^BOM-[A-Z2-9]{6}$/)
    assert.isString(response.body().createdAt)
    assert.isString(response.body().updatedAt)
    assert.isAtLeast(Date.parse(response.body().updatedAt), Date.parse(response.body().createdAt))
  })

  test('persists a saved Template so a later catalog request can reload it', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ kind: 'template', name: 'Cape construction', description: null })

    created.assertStatus(201)

    const reloaded = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    reloaded.assertStatus(200)
    reloaded.assertBodyContains({
      billsOfMaterials: [
        {
          id: created.body().id,
          kind: 'template',
          name: 'Cape construction',
          description: null,
        },
      ],
    })
  })

  test('atomically creates and reloads ordered repeated and incomplete BOM Lines', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')

    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Layered skirt construction',
        description: null,
        lines: [
          {
            constructionPiece: '  Outer skirt  ',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: '  Cut on grain  ',
          },
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: null,
          },
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            lineNote: 'Resolve during drape review',
          },
        ],
      })

    created.assertStatus(201)
    assert.deepEqual(
      created.body().lines.map((line: Record<string, unknown>) => ({
        constructionPiece: line.constructionPiece,
        materialId: (line.material as { id: string } | null)?.id ?? null,
        materialQuantity: line.materialQuantity,
        lineNote: line.lineNote,
        order: line.order,
        completeness: line.completeness,
      })),
      [
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 3.125,
          lineNote: 'Cut on grain',
          order: 0,
          completeness: 'complete',
        },
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 3.125,
          lineNote: null,
          order: 1,
          completeness: 'complete',
        },
        {
          constructionPiece: 'Lining',
          materialId: null,
          materialQuantity: null,
          lineNote: 'Resolve during drape review',
          order: 2,
          completeness: 'incomplete',
        },
      ]
    )
    assert.equal(new Set(created.body().lines.map((line: { id: string }) => line.id)).size, 3)
    created.body().lines.forEach((line: { id: string }) => {
      assert.match(line.id, /^BML-[A-Z2-9]{6}$/)
    })

    const reloaded = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), created.body())
  })

  test('records current Operator evidence only for Complete lines', async ({ assert, client }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const requestedAt = Date.now()

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Reviewed construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: null,
            verified: true,
          },
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })

    response.assertStatus(201)
    assert.equal(response.body().lines[0].completeness, 'complete')
    assert.equal(response.body().lines[0].verification.status, 'verified')
    assert.deepEqual(response.body().lines[0].verification.verifiedBy, {
      id: session.userId,
      email: 'operator@example.com',
    })
    assert.isString(response.body().lines[0].verification.verifiedAt)
    assert.isAtLeast(Date.parse(response.body().lines[0].verification.verifiedAt), requestedAt)
    assert.deepInclude(response.body().lines[1], {
      completeness: 'incomplete',
      verification: {
        status: 'unverified',
        verifiedBy: null,
        verifiedAt: null,
      },
    })

    const reloaded = await client
      .get(`/bills-of-materials/${response.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), response.body())
  })

  test('rejects verification for an Incomplete line without creating anything', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Must remain atomic',
        description: null,
        lines: [
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: true,
          },
        ],
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: {
        lines: ['Only a Complete BOM Line can be verified.'],
      },
    })
    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('rejects invalid or unavailable Material line data without creating anything', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const unavailableMaterial = await Material.findByOrFail('publicId', 'M-0003')
    await unavailableMaterial.softDelete()
    const session = await authenticateAs(client, 'operator')

    for (const lines of [
      [
        {
          constructionPiece: '   ',
          materialId: null,
          materialQuantity: null,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: null,
          materialQuantity: 1,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: 'M-0001',
          materialQuantity: 0,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: 'M-0001',
          materialQuantity: 1.2345,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: 'M-0003',
          materialQuantity: 1,
          lineNote: null,
        },
      ],
    ]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ kind: 'template', name: 'Must remain atomic', description: null, lines })

      response.assertStatus(422)
    }

    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('rejects invalid names and unsupported Implementation creation without a record', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    for (const payload of [
      { kind: 'template', name: '   ', description: null },
      { kind: 'implementation', name: 'Not in this slice', description: null },
    ]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json(payload)
      response.assertStatus(422)
    }

    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('requires bearer authentication for catalog and creation', async ({ client }) => {
    const responses = await Promise.all([
      client.get('/bills-of-materials'),
      client.get('/bills-of-materials/BOM-ABC234'),
      client
        .post('/bills-of-materials')
        .json({ kind: 'template', name: 'No session', description: null }),
    ])

    responses.forEach((response) => response.assertStatus(401))
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  const user = await User.updateOrCreate(
    { email: `${role}@example.com` },
    { email: `${role}@example.com`, password: 'Password123', role, active: true }
  )
  const response = await client.post('/auth/login').json({
    email: `${role}@example.com`,
    password: 'Password123',
  })
  response.assertStatus(200)
  return { token: response.body().token as string, userId: user.id }
}
