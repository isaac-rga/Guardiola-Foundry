import { DateTime } from 'luxon'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { BaseModel, beforeFetch, beforeFind, column } from '@adonisjs/lucid/orm'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export const SoftDelete = <T extends NormalizeConstructor<typeof BaseModel>>(Base: T) => {
  class SoftDeleteModel extends Base {
    @column.dateTime({ columnName: 'deleted_at' })
    declare deletedAt: DateTime | null

    @beforeFind()
    static ignoreDeletedFind(query: ModelQueryBuilderContract<typeof SoftDeleteModel>) {
      query.whereNull('deleted_at')
    }

    @beforeFetch()
    static ignoreDeletedFetch(query: ModelQueryBuilderContract<typeof SoftDeleteModel>) {
      query.whereNull('deleted_at')
    }

    static queryWithDeleted<Model extends typeof SoftDeleteModel>(
      this: Model
    ): ModelQueryBuilderContract<Model> {
      return this.query().pojo() as ModelQueryBuilderContract<Model>
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
