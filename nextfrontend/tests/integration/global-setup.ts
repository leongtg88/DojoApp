import { execSync } from 'node:child_process'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { TEST_DB, TEST_DATABASE_URL } from './config'

// Levanta un Postgres efímero en un puerto fijo, aplica las migraciones y lo apaga
// al terminar. Corre una sola vez por corrida de la suite de integración.
export default async function setup() {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase(TEST_DB.database)
    .withUsername(TEST_DB.user)
    .withPassword(TEST_DB.password)
    .withExposedPorts({ container: 5432, host: TEST_DB.port })
    .start()

  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL }

  try {
    execSync('pnpm exec prisma migrate deploy', { env, stdio: 'pipe' })
  } catch (error) {
    const output = error as { stdout?: Buffer; stderr?: Buffer }
    console.error('[integration] Falló `prisma migrate deploy`:')
    console.error(output.stdout?.toString() ?? '')
    console.error(output.stderr?.toString() ?? '')
    await container.stop()
    throw error
  }

  return async function teardown() {
    await container.stop()
  }
}
