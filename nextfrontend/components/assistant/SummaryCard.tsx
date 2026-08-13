const LABELS: Record<string, string> = {
  tipo_alumno: 'Alumno',
  edad: 'Edad',
  programa: 'Programa',
  horario_pref: 'Horario',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Email',
  nota: 'Nota',
};

export default function SummaryCard({ data }: { data: Record<string, string> }) {
  const entries = Object.entries(LABELS).filter(([key]) => data[key] !== '');

  return (
    <div className="max-w-[85%] rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
      <h4 className="font-semibold text-gray-900">Resumen de tu solicitud</h4>
      <dl className="mt-3 space-y-1 text-gray-700">
        {entries.map(([key, label]) => (
          <div key={key} className="flex justify-between gap-4">
            <dt className="capitalize text-gray-500">{label}</dt>
            <dd className="text-right font-medium">{data[key] || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
