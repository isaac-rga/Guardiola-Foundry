import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column } from '@adonisjs/lucid/orm'
import type { UserRole } from '@guardiola-foundry/shared-types'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({
    prepare: (value: string) => User.normalizeEmailAddress(value),
  })
  declare email: string

  @column({ columnName: 'password_hash', serializeAs: null })
  declare password: string

  @column()
  declare role: UserRole

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static normalizeEmailAddress(email: string) {
    return email.trim().toLowerCase()
  }

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }
}
