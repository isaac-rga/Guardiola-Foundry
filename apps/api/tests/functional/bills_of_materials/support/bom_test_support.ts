import User from '#models/user'

export async function authenticateAs(client: any, role: 'admin' | 'operator') {
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

export async function createProduct(
  client: any,
  token: string,
  name: string,
  overrides?: { lifecycleStatus?: string }
) {
  const response = await client
    .post('/products')
    .header('Authorization', `Bearer ${token}`)
    .json({ name, ...overrides })
  response.assertStatus(201)
  return response.body().id as string
}

export async function createTemplate(
  client: any,
  token: string,
  name: string,
  options?: { productId?: string }
) {
  const response = await client
    .post('/bills-of-materials')
    .header('Authorization', `Bearer ${token}`)
    .json({ kind: 'template', name, description: null, ...options })
  response.assertStatus(201)
  return response.body() as { id: string }
}

export async function createProductVariant(
  client: any,
  token: string,
  productId: string,
  name: string
) {
  const response = await client
    .post(`/products/${productId}/variants`)
    .header('Authorization', `Bearer ${token}`)
    .json({ name })
  response.assertStatus(201)
  return response.body().id as string
}

export async function updateProduct(
  client: any,
  token: string,
  productId: string,
  name: string,
  productStatus: 'active' | 'inactive'
) {
  const response = await client
    .put(`/products/${productId}`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      name,
      shortDescription: null,
      lifecycleStatus: 'concept',
      productStatus,
      productCategory: null,
      collectionId: null,
    })
  response.assertStatus(200)
}

export async function updateProductVariant(
  client: any,
  token: string,
  productId: string,
  variantId: string,
  name: string,
  status: 'active' | 'inactive'
) {
  const response = await client
    .put(`/products/${productId}/variants/${variantId}`)
    .header('Authorization', `Bearer ${token}`)
    .json({ name, status })
  response.assertStatus(200)
}

export async function createImplementation(
  client: any,
  token: string,
  productVariantId: string,
  name: string
) {
  const response = await client
    .post('/bills-of-materials')
    .header('Authorization', `Bearer ${token}`)
    .json({ kind: 'implementation', name, description: null, productVariantId, lines: [] })
  response.assertStatus(201)
  return response.body() as { id: string; product: { id: string } }
}

export async function createPatternSet(client: any, token: string, name: string) {
  const response = await client
    .post('/pattern-sets')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name,
      description: 'Reusable pattern evidence',
      quantityProposals: [
        { assumedWidthCm: 140, quantityMeters: 3.25, evidenceNote: 'Marker study' },
      ],
    })
  response.assertStatus(201)
  return response.body() as { id: string }
}
