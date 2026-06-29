import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: env.get('NODE_ENV') === 'test' ? 'postgres_test' : 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    postgres_test: {
      client: 'pg',
      connection: {
        host: env.get('DB_TEST_HOST') ?? env.get('DB_HOST'),
        port: env.get('DB_TEST_PORT') ?? env.get('DB_PORT'),
        user: env.get('DB_TEST_USER') ?? env.get('DB_USER'),
        password: env.get('DB_TEST_PASSWORD') ?? env.get('DB_PASSWORD'),
        database: env.get('DB_TEST_DATABASE') ?? `${env.get('DB_DATABASE')}_test`,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
