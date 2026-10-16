import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cliente de Prisma generado (no se edita a mano).
    "lib/generated/**",
    // Prototipos/maquetas externas (también excluidas en tsconfig.json).
    "components/dashboard/tosei-gusoku-dojo---portal-del-estudiante-1/**",
    "components/dashboard/tosei-gusoku-dojo---sistema-de-seguimiento-marcial-/**",
  ]),
  // INV-01 (docs/domain): la UI no debe formatear fechas directamente. Usa los
  // helpers de @/lib/format/datetime, que fijan UTC/RD y evitan el off-by-one.
  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
          message:
            "No formatees fechas en la UI: usa los helpers de @/lib/format/datetime (formatDate/formatDateTime/formatCalendarDate). Ver docs/domain/invariantes.md (INV-01).",
        },
      ],
    },
  },
]);

export default eslintConfig;
