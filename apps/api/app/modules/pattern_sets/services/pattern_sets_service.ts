import PatternSet from '#modules/pattern_sets/models/pattern_set'
import PatternSetQuantityProposal from '#modules/pattern_sets/models/pattern_set_quantity_proposal'
import { countPatternSetUsage } from '#modules/bills_of_materials/services/pattern_set_usage'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  CreatePatternSetRequest,
  ListPatternSetsResponse,
  PatternSetUsageImpact,
  PatternSet as PatternSetContract,
  SearchPatternSetsResponse,
  UpdatePatternSetRequest,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const PATTERN_SET_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PATTERN_SET_ID_LENGTH = 6
const PATTERN_SET_SEARCH_LIMIT = 25
const NORMALIZED_PATTERN_SET_SEARCH_DOCUMENT = `
  regexp_replace(
    translate(lower(concat_ws(' ', pattern_sets.public_id, pattern_sets.name)),
      'áéíóúüñ',
      'aeiouun'
    ),
    '\\s+',
    ' ',
    'g'
  )
`

type MutationResult = PatternSetContract | 'duplicate-name' | 'not-found' | 'retired'

export async function listPatternSets(includeRetired = false): Promise<ListPatternSetsResponse> {
  const query = PatternSet.query()
    .preload('createdBy')
    .preload('quantityProposals', (proposals) => proposals.orderBy('assumedWidthCm', 'asc'))
    .orderBy('name', 'asc')

  if (!includeRetired) {
    query.where('status', 'active')
  }

  const patternSets = await query

  return { patternSets: patternSets.map(serializePatternSet) }
}

export async function searchPatternSets(search: string): Promise<SearchPatternSetsResponse> {
  const normalizedId = 'lower(pattern_sets.public_id)'
  const normalizedName = `translate(lower(pattern_sets.name), 'áéíóúüñ', 'aeiouun')`
  const query = db
    .from('pattern_sets')
    .leftJoin(
      'pattern_set_quantity_proposals',
      'pattern_set_quantity_proposals.pattern_set_id',
      'pattern_sets.id'
    )
    .where('pattern_sets.status', 'active')
    .select('pattern_sets.public_id', 'pattern_sets.name')
    .count('pattern_set_quantity_proposals.id as quantity_proposal_count')
    .groupBy('pattern_sets.id')
    .orderByRaw(
      `CASE
        WHEN ${normalizedId} = ? THEN 0
        WHEN ${normalizedName} = ? THEN 1
        WHEN ${normalizedId} LIKE ? THEN 2
        WHEN ${normalizedName} LIKE ? THEN 3
        ELSE 4
      END`,
      [search, search, `${search}%`, `${search}%`]
    )
    .orderBy('pattern_sets.name', 'asc')
    .orderBy('pattern_sets.public_id', 'asc')
    .limit(PATTERN_SET_SEARCH_LIMIT + 1)

  search.split(' ').forEach((term) => {
    query.whereRaw(`position(? in ${NORMALIZED_PATTERN_SET_SEARCH_DOCUMENT}) > 0`, [term])
  })

  const rows = await query
  return {
    items: rows.slice(0, PATTERN_SET_SEARCH_LIMIT).map((row) => ({
      id: row.public_id,
      name: row.name,
      quantityProposalCount: Number(row.quantity_proposal_count),
    })),
    hasMore: rows.length > PATTERN_SET_SEARCH_LIMIT,
  }
}

export async function getPatternSet(publicId: string): Promise<PatternSetContract | null> {
  const patternSet = await loadPatternSetOrNull(publicId)
  return patternSet ? serializePatternSet(patternSet) : null
}

export async function getPatternSetUsageImpact(
  publicId: string
): Promise<PatternSetUsageImpact | null> {
  const patternSet = await PatternSet.findBy('publicId', publicId)
  return patternSet ? countPatternSetUsage(patternSet.id) : null
}

export async function createPatternSet(
  createdByUserId: number,
  payload: CreatePatternSetRequest
): Promise<MutationResult> {
  try {
    return await db.transaction(async (trx) => {
      if (await hasDuplicateName(payload.name, undefined, trx)) {
        return 'duplicate-name'
      }

      const patternSet = await PatternSet.create(
        {
          publicId: await generatePatternSetId(trx),
          name: payload.name,
          description: payload.description,
          status: 'active',
          createdByUserId,
        },
        { client: trx }
      )

      await replaceQuantityProposals(patternSet.id, payload.quantityProposals, trx)
      return await loadPatternSet(patternSet.publicId, trx)
    })
  } catch (error) {
    if (isPatternSetNameConflict(error)) return 'duplicate-name'
    throw error
  }
}

export async function updatePatternSet(
  publicId: string,
  payload: UpdatePatternSetRequest
): Promise<MutationResult> {
  try {
    return await db.transaction(async (trx) => {
      const patternSet = await PatternSet.query({ client: trx })
        .where('publicId', publicId)
        .forUpdate()
        .first()

      if (!patternSet) return 'not-found'
      if (patternSet.status === 'retired') return 'retired'
      if (await hasDuplicateName(payload.name, patternSet.id, trx)) return 'duplicate-name'

      patternSet.merge({ name: payload.name, description: payload.description })
      await patternSet.save()
      await replaceQuantityProposals(patternSet.id, payload.quantityProposals, trx)
      return await loadPatternSet(patternSet.publicId, trx)
    })
  } catch (error) {
    if (isPatternSetNameConflict(error)) return 'duplicate-name'
    throw error
  }
}

export async function retirePatternSet(publicId: string): Promise<'retired' | 'not-found'> {
  return db.transaction(async (trx) => {
    const patternSet = await PatternSet.query({ client: trx })
      .where('publicId', publicId)
      .forUpdate()
      .first()
    if (!patternSet || patternSet.status === 'retired') return 'not-found'
    patternSet.status = 'retired'
    await patternSet.save()
    return 'retired'
  })
}

export async function restorePatternSet(
  publicId: string
): Promise<PatternSetContract | 'not-found'> {
  return db.transaction(async (trx) => {
    const patternSet = await PatternSet.query({ client: trx })
      .where('publicId', publicId)
      .forUpdate()
      .first()
    if (!patternSet || patternSet.status !== 'retired') return 'not-found'
    patternSet.status = 'active'
    await patternSet.save()
    return await loadPatternSet(publicId, trx)
  })
}

async function replaceQuantityProposals(
  patternSetId: number,
  proposals: CreatePatternSetRequest['quantityProposals'],
  trx: TransactionClientContract
) {
  await PatternSetQuantityProposal.query({ client: trx })
    .where('patternSetId', patternSetId)
    .delete()
  if (proposals.length === 0) return
  await PatternSetQuantityProposal.createMany(
    [...proposals]
      .sort((left, right) => left.assumedWidthCm - right.assumedWidthCm)
      .map((proposal) => ({ ...proposal, patternSetId })),
    { client: trx }
  )
}

async function loadPatternSet(publicId: string, trx?: TransactionClientContract) {
  const patternSet = await loadPatternSetOrNull(publicId, trx)
  if (!patternSet) throw new Error(`Pattern Set ${publicId} could not be reloaded.`)
  return serializePatternSet(patternSet)
}

async function loadPatternSetOrNull(publicId: string, trx?: TransactionClientContract) {
  return PatternSet.query(trx ? { client: trx } : undefined)
    .where('publicId', publicId)
    .preload('createdBy')
    .preload('quantityProposals', (query) => query.orderBy('assumedWidthCm', 'asc'))
    .first()
}

function serializePatternSet(patternSet: PatternSet): PatternSetContract {
  return {
    id: patternSet.publicId,
    name: patternSet.name,
    description: patternSet.description,
    status: patternSet.status,
    quantityProposals: patternSet.quantityProposals.map((proposal) => ({
      assumedWidthCm: Number(proposal.assumedWidthCm),
      quantityMeters: Number(proposal.quantityMeters),
      evidenceNote: proposal.evidenceNote,
    })),
    createdBy: { id: patternSet.createdBy.id, email: patternSet.createdBy.email },
    createdAt: patternSet.createdAt.toISO()!,
  }
}

async function hasDuplicateName(
  name: string,
  excludedId?: number,
  trx?: TransactionClientContract
) {
  const query = PatternSet.query(trx ? { client: trx } : undefined).whereRaw(
    'lower(btrim(name)) = lower(btrim(?))',
    [name]
  )
  if (excludedId !== undefined) query.whereNot('id', excludedId)
  return Boolean(await query.first())
}

async function generatePatternSetId(trx: TransactionClientContract) {
  while (true) {
    const bytes = randomBytes(PATTERN_SET_ID_LENGTH)
    const token = Array.from(
      bytes,
      (byte) => PATTERN_SET_ID_ALPHABET[byte % PATTERN_SET_ID_ALPHABET.length]
    ).join('')
    const candidate = `PS-${token}`
    if (!(await PatternSet.query({ client: trx }).where('publicId', candidate).first()))
      return candidate
  }
}

function isPatternSetNameConflict(error: unknown) {
  return (
    error instanceof Error &&
    'constraint' in error &&
    error.constraint === 'pattern_sets_normalized_name_unique'
  )
}
