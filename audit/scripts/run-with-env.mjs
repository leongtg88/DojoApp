import path from 'node:path'
import { spawn } from 'node:child_process'
import dotenv from 'dotenv'

const [envFile, command, ...args] = process.argv.slice(2)
if (!envFile || !command) {
  console.error('Uso: node audit/scripts/run-with-env.mjs <env-file> <command> [args...]')
  process.exit(2)
}

dotenv.config({ path: path.resolve(envFile), override: true, quiet: true })

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Proceso terminado por señal ${signal}`)
    process.exit(1)
  }
  process.exit(code ?? 0)
})
