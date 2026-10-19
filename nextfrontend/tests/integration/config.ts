// Configuración compartida de la base de datos de pruebas de integración.
// Se usa un puerto host fijo para que las URLs sean deterministas (ver vitest.config.mts).
export const TEST_DB = {
  host: 'localhost',
  port: 55432,
  database: 'dojo_test',
  user: 'test',
  password: 'test',
} as const

export const TEST_DATABASE_URL = `postgresql://${TEST_DB.user}:${TEST_DB.password}@${TEST_DB.host}:${TEST_DB.port}/${TEST_DB.database}`
