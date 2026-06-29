import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'Password123'

export default class extends BaseSeeder {
  async run() {
    const adminUser = await User.findBy('email', User.normalizeEmailAddress(ADMIN_EMAIL))

    if (!adminUser) {
      await User.create({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        active: true,
      })

      return
    }

    adminUser.merge({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      active: true,
    })

    await adminUser.save()
  }
}
