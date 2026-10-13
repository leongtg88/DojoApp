import subprocess
import sys

# Verificar el hash del alumno directamente via prisma
script = """
import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

async function main() {
  const user = await db.user.findUnique({
    where: { email: 'alumno@test.com' },
    select: { email: true, passwordHash: true, roles: true, emailVerified: true }
  })
  if (!user) { console.log('USER NOT FOUND'); return }
  console.log('email:', user.email)
  console.log('roles:', user.roles)
  console.log('emailVerified:', user.emailVerified)
  const match = await bcrypt.compare('Alumno5366!', user.passwordHash ?? '')
  console.log('password match:', match)
}

main().finally(() => db.$disconnect())
"""

with open('tests/check_user.ts', 'w') as f:
    f.write(script)

result = subprocess.run(
    ['pnpm', 'tsx', 'tests/check_user.ts'],
    capture_output=True, text=True
)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[:500])
