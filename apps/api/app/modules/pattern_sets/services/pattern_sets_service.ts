import PatternSet from '#modules/pattern_sets/models/pattern_set'
import PatternSetQuantityProposal from '#modules/pattern_sets/models/pattern_set_quantity_proposal'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  CreatePatternSetRequest,
  ListPatternSetsResponse,
  PatternSet as PatternSetContract,
  UpdatePatternSetRequest,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const PATTERN_SET_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PATTERN_SET_ID_LENGTH = 6

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
  const patternSet = await PatternSet.query(trx ? { client: trx } : undefined)
    .where('publicId', publicId)
    .preload('createdBy')
    .preload('quantityProposals', (query) => query.orderBy('assumedWidthCm', 'asc'))
    .firstOrFail()
  return serializePatternSet(patternSet)
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
