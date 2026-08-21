import type { EnrollmentDraft } from '@/lib/flow';

const LABELS: Partial<Record<keyof EnrollmentDraft, string>> = {
  tipo_alumno: 'Alumno',
  edad: 'Edad',
  programa: 'Programa',
  horario_pref: 'Horario',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Email',
  nota: 'Nota',
};

export default function SummaryCard({ data }: { data: EnrollmentDraft }) {
  const entries = Object.entries(LABELS) as [keyof EnrollmentDraft, string][];

  return (
    <div className="max-w-[85%] rounded-2xl border border-white/10 bg-zinc-800 p-4 text-sm shadow-sm">
      <h4 className="font-semibold text-white">Resumen de tu solicitud</h4>
      <dl className="mt-3 space-y-1 text-gray-300">
        {entries
          .filter(([key]) => data[key] !== '')
          .map(([key, label]) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="capitalize text-gray-400">{label}</dt>
              <dd className="text-right font-medium text-white">{data[key] || '—'}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
