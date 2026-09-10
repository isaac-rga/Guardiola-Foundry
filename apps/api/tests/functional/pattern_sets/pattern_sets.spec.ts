import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import PatternSet from '#modules/pattern_sets/models/pattern_set'
import PatternSetQuantityProposal from '#modules/pattern_sets/models/pattern_set_quantity_proposal'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Pattern Sets', (group) => {
  group.each.setup(async () => {
    await BillOfMaterial.query().delete()
    await PatternSetQuantityProposal.query().delete()
    await PatternSet.query().delete()
    await testUtils.db('postgres_test').truncate()
  })

  test('creates a Pattern Set with immutable creation metadata and sorted proposals', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const response = await client
      .post('/pattern-sets')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: '  Jackie skirt patterns  ',
        description: '  Floor-length cutting evidence  ',
        quantityProposals: [
          { assumedWidthCm: 150, quantityMeters: 4.125, evidenceNote: '  Wide goods  ' },
          { assumedWidthCm: 110, quantityMeters: 5.5, evidenceNote: null },
        ],
      })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Jackie skirt patterns',
      description: 'Floor-length cutting evidence',
      status: 'active',
      createdBy: { id: session.userId, email: 'operator@example.com' },
      quantityProposals: [
        { assumedWidthCm: 110, quantityMeters: 5.5, evidenceNote: null },
        { assumedWidthCm: 150, quantityMeters: 4.125, evidenceNote: 'Wide goods' },
      ],
    })
    assert.match(response.body().id, /^PS-[A-Z2-9]{6}$/)
    assert.isString(response.body().createdAt)
  })

  test('rejects normalized duplicate names across Active and Retired records', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const first = await createPatternSet(client, session.token, 'Circle Skirt')
    await client
      .delete(`/pattern-sets/${first.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    const response = await client
      .post('/pattern-sets')
      .header('Authorization', `Bearer ${session.token}`)
      .json(patternSetPayload('  circle skirt  '))

    response.assertStatus(422)
    response.assertBodyContains({
      errors: { name: ['Another Active or Retired Pattern Set already uses this name.'] },
    })
  })

  test('validates positive proposal values, precision, and unique assumed widths', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    for (const quantityProposals of [
      [{ assumedWidthCm: 0, quantityMeters: 2, evidenceNote: null }],
      [{ assumedWidthCm: 140, quantityMeters: 1.2345, evidenceNote: null }],
      [
        { assumedWidthCm: 140, quantityMeters: 2, evidenceNote: null },
        { assumedWidthCm: 140, quantityMeters: 3, evidenceNote: 'duplicate' },
      ],
    ]) {
      const response = await client
        .post('/pattern-sets')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ ...patternSetPayload('Invalid proposals'), quantityProposals })

      response.assertStatus(422)
    }

    const count = await PatternSet.query().count('* as total').firstOrFail()
    assertCount(count.$extras.total, 0)
  })

  test('edits an Active Pattern Set while preserving identity and creation metadata', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const original = await createPatternSet(client, session.token, 'Original')

    const response = await client
      .put(`/pattern-sets/${original.id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Renamed',
        description: 'Revised evidence',
        quantityProposals: [
          { assumedWidthCm: 160, quantityMeters: 2.75, evidenceNote: 'Latest toile' },
        ],
      })

    response.assertStatus(200)
    response.assertBodyContains({
      id: original.id,
      name: 'Renamed',
      description: 'Revised evidence',
      createdBy: original.createdBy,
      createdAt: original.createdAt,
      quantityProposals: [
        { assumedWidthCm: 160, quantityMeters: 2.75, evidenceNote: 'Latest toile' },
      ],
    })
  })

  test('retires and restores without changing identity, description, or proposals', async ({
    client,
  }) => {
    const operator = await authenticateAs(client, 'operator')
    const original = await createPatternSet(client, operator.token, 'Recoverable')

    const retireResponse = await client
      .delete(`/pattern-sets/${original.id}`)
      .header('Authorization', `Bearer ${operator.token}`)
    retireResponse.assertStatus(204)

    const ordinaryList = await client
      .get('/pattern-sets')
      .header('Authorization', `Bearer ${operator.token}`)
    ordinaryList.assertBody({ patternSets: [] })

    const editResponse = await client
      .put(`/pattern-sets/${original.id}`)
      .header('Authorization', `Bearer ${operator.token}`)
      .json(patternSetPayload('Changed while retired'))
    editResponse.assertStatus(422)
    editResponse.assertBodyContains({
      errors: { status: ['Retired Pattern Sets cannot be edited.'] },
    })

    const admin = await authenticateAs(client, 'admin')
    const recoveryList = await client
      .get('/pattern-sets?includeRetired=true')
      .header('Authorization', `Bearer ${admin.token}`)
    recoveryList.assertBodyContains({ patternSets: [{ id: original.id, status: 'retired' }] })

    const restoreResponse = await client
      .post(`/pattern-sets/${original.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    restoreResponse.assertStatus(200)
    restoreResponse.assertBodyContains({
      id: original.id,
      description: original.description,
      quantityProposals: original.quantityProposals,
      status: 'active',
    })
  })

  test('keeps retired browsing and restoration Admin-only', async ({ client }) => {
    const operator = await authenticateAs(client, 'operator')
    const original = await createPatternSet(client, operator.token, 'Hidden retired record')
    await client
      .delete(`/pattern-sets/${original.id}`)
      .header('Authorization', `Bearer ${operator.token}`)

    const operatorList = await client
      .get('/pattern-sets?includeRetired=true')
      .header('Authorization', `Bearer ${operator.token}`)
    operatorList.assertBody({ patternSets: [] })

    const restoreResponse = await client
      .post(`/pattern-sets/${original.id}/restore`)
      .header('Authorization', `Bearer ${operator.token}`)
    restoreResponse.assertStatus(403)
  })

  test('searches Active Pattern Sets and reports their current proposal counts', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const active = await createPatternSet(client, session.token, 'Circle Skirt')
    const retired = await createPatternSet(client, session.token, 'Retired Skirt')
    await client
      .delete(`/pattern-sets/${retired.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    const response = await client
      .get('/pattern-sets/search?search=skirt')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(response.body(), {
      items: [{ id: active.id, name: 'Circle Skirt', quantityProposalCount: 1 }],
      hasMore: false,
    })
  })

  test('resolves retained records and counts affected lines and Bills of Materials', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const patternSet = await createPatternSet(client, session.token, 'Used patterns')

    for (const [name, lineCount] of [
      ['First construction', 2],
      ['Second construction', 1],
    ] as const) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json({
          kind: 'template',
          name,
          description: null,
          lines: Array.from({ length: lineCount }, (_, index) => ({
            constructionPiece: `Piece ${index + 1}`,
            materialId: null,
            materialQuantity: null,
            patternSetId: patternSet.id,
            lineNote: null,
          })),
        })
      response.assertStatus(201)
    }

    const impact = await client
      .get(`/pattern-sets/${patternSet.id}/usage`)
      .header('Authorization', `Bearer ${session.token}`)
    impact.assertStatus(200)
    assert.deepEqual(impact.body(), {
      billOfMaterialsLineCount: 3,
      billOfMaterialsCount: 2,
    })

    const retireResponse = await client
      .delete(`/pattern-sets/${patternSet.id}`)
      .header('Authorization', `Bearer ${session.token}`)
    retireResponse.assertStatus(204)
    const retained = await client
      .get(`/pattern-sets/${patternSet.id}`)
      .header('Authorization', `Bearer ${session.token}`)
    retained.assertStatus(200)
    retained.assertBodyContains({ id: patternSet.id, status: 'retired' })
  })

  test('requires bearer authentication for every Pattern Set route', async ({ client }) => {
    const payload = patternSetPayload('Unauthenticated')
    const responses = await Promise.all([
      client.get('/pattern-sets'),
      client.get('/pattern-sets/search?search=pattern'),
      client.get('/pattern-sets/PS-NOAUTH'),
      client.get('/pattern-sets/PS-NOAUTH/usage'),
      client.post('/pattern-sets').json(payload),
      client.put('/pattern-sets/PS-NOAUTH').json(payload),
      client.delete('/pattern-sets/PS-NOAUTH'),
      client.post('/pattern-sets/PS-NOAUTH/restore'),
    ])

    responses.forEach((response) => response.assertStatus(401))
  })
})

function patternSetPayload(name: string) {
  return {
    name,
    description: 'Pattern evidence',
    quantityProposals: [
      { assumedWidthCm: 140, quantityMeters: 3.25, evidenceNote: 'Sample cutting' },
    ],
  }
}

async function createPatternSet(client: any, token: string, name: string) {
  const response = await client
    .post('/pattern-sets')
    .header('Authorization', `Bearer ${token}`)
    .json(patternSetPayload(name))
  response.assertStatus(201)
  return response.body()
}

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

function assertCount(value: string | number, expected: number) {
  if (Number(value) !== expected) throw new Error(`Expected ${expected}, received ${value}`)
}
