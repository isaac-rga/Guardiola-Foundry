import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import User from '#models/user'
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
