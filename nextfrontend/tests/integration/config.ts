// Configuración compartida de la base de datos de pruebas de integración.
// El puerto se puede sobreescribir con TEST_DB_PORT cuando el puerto por
// defecto cae en un rango reservado por el sistema (p. ej. Windows/Hyper-V).
const port = Number(process.env.TEST_DB_PORT ?? 55432)

export const TEST_DB = {
  host: 'localhost',
  port,
  database: 'dojo_test',
  user: 'test',
  password: 'test',
} as const

export const TEST_DATABASE_URL = `postgresql://${TEST_DB.user}:${TEST_DB.password}@${TEST_DB.host}:${TEST_DB.port}/${TEST_DB.database}`
