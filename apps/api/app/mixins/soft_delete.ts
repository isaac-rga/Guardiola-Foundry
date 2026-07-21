import { DateTime } from 'luxon'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { BaseModel, beforeFetch, beforeFind, column } from '@adonisjs/lucid/orm'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

const includeDeletedQueryFlag = '__includeDeleted'

export const SoftDelete = <T extends NormalizeConstructor<typeof BaseModel>>(Base: T) => {
  class SoftDeleteModel extends Base {
    @column.dateTime({ columnName: 'deleted_at' })
    declare deletedAt: DateTime | null

    @beforeFind()
    static ignoreDeletedFind(query: ModelQueryBuilderContract<typeof SoftDeleteModel>) {
      if (
        (query as ModelQueryBuilderContract<typeof SoftDeleteModel> & Record<string, boolean>)[
          includeDeletedQueryFlag
        ]
      ) {
        return
      }

      query.whereNull('deleted_at')
    }

    @beforeFetch()
    static ignoreDeletedFetch(query: ModelQueryBuilderContract<typeof SoftDeleteModel>) {
      if (
        (query as ModelQueryBuilderContract<typeof SoftDeleteModel> & Record<string, boolean>)[
          includeDeletedQueryFlag
        ]
      ) {
        return
      }

      query.whereNull('deleted_at')
    }

    static queryWithDeleted<Model extends typeof SoftDeleteModel>(
      this: Model
    ): ModelQueryBuilderContract<Model> {
      const query = this.query() as ModelQueryBuilderContract<Model> & Record<string, boolean>

      this.includeDeleted(query)

      return query
    }

    static includeDeleted(query: unknown) {
      const queryWithFlags = query as Record<string, boolean>
      queryWithFlags[includeDeletedQueryFlag] = true

      return query
    }

    async softDelete() {
      this.deletedAt = DateTime.utc()
      await this.save()
    }

    async restore() {
      this.deletedAt = null
      await this.save()
    }
  }

  return SoftDeleteModel
}
