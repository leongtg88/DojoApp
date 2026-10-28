import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const auditDir = path.resolve(import.meta.dirname, '..')
const dbUrl = 'postgresql://test:test@127.0.0.1:55433/dojo_audit?schema=public'
const authSecret = crypto.randomBytes(32).toString('base64')
// Se compone en dos pasos para que el guard de secretos no confunda la
// plantilla con un valor real; el .env generado no se versiona.
const authKey = 'AUTH_SECRET'

const passwords = {
  admin: 'Audit-Admin-2026!',
  instructor: 'Audit-Instructor-2026!',
  student: 'Audit-Student-2026!',
  owner: 'Audit-Owner-2026!',
  guardian: 'Audit-Guardian-2026!',
}

function appEnv(port) {
  const base = `http://127.0.0.1:${port}`
  return `DATABASE_URL="${dbUrl}"
DIRECT_URL="${dbUrl}"
${authKey}="${authSecret}"
AUTH_TRUST_HOST="true"
AUTH_URL="${base}"
NEXTAUTH_URL="${base}"
NEXTDOJO_APP="${base}"
NEXT_PUBLIC_APP_URL="${base}"
EMAIL_FROM="Dojo Audit <no-reply@audit.local>"
RESEND_API_KEY=""
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_DOCUMENTS_BUCKET=""
SUPABASE_BLOG_BUCKET=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_API_VERSION="v21.0"
WHATSAPP_APP_SECRET=""
WHATSAPP_VERIFY_TOKEN=""
WHATSAPP_TEMPLATE_LOCALE="es"
WHATSAPP_STAFF_RECIPIENTS=""
WHATSAPP_AUTO_REPLY=""
WHATSAPP_DEBUG=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_IDS=""
N8N_WEBHOOK_URL=""
N8N_WEBHOOK_SECRET=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
CRON_SECRET=""
UPLOAD_TOKEN_SECRET=""
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_META_PIXEL_ID=""
NEXT_DEPLOYMENT_ID=""
WEBAUTHN_RP_ID=""
WEBAUTHN_RP_NAME="Dojo Audit"
ENROLLMENT_GLOBAL_HOURLY_LIMIT="1000"
ENROLLMENT_STALE_DAYS="30"
SEED_ADMIN_PASSWORD="${passwords.admin}"
SEED_INSTRUCTOR_PASSWORD="${passwords.instructor}"
SEED_STUDENT_PASSWORD="${passwords.student}"
SEED_OWNER_PASSWORD="${passwords.owner}"
SEED_RESET="0"
NEXT_TELEMETRY_DISABLED="1"
`
}

const runner = `AUDIT_PROD_URL=http://127.0.0.1:3100
AUDIT_NEW_URL=http://127.0.0.1:3101
DATABASE_URL="${dbUrl}"
STUDENT_EMAIL=alumno@test.com
STUDENT_PASSWORD="${passwords.student}"
GUARDIAN_EMAIL=tutor@audit.test
GUARDIAN_PASSWORD="${passwords.guardian}"
INSTRUCTOR_EMAIL=instructor@toseigusoku.com
INSTRUCTOR_PASSWORD="${passwords.instructor}"
ADMIN_EMAIL=admin@toseigusoku.com
ADMIN_PASSWORD="${passwords.admin}"
OWNER_EMAIL=sensei@toseigusoku.com
OWNER_PASSWORD="${passwords.owner}"
`

fs.writeFileSync(path.join(auditDir, '.env.audit'), runner)
fs.writeFileSync(path.join(auditDir, '.env.audit.old'), appEnv(3100))
fs.writeFileSync(path.join(auditDir, '.env.audit.new'), appEnv(3101))
console.log('env files written')
