import type { EnrollmentDraft } from '@/lib/flow';

function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9]/g, '')) || 0;
}

export default function PricingSummaryCard({ draft }: { draft: EnrollmentDraft }) {
  const planNum = parsePrice(draft.plan_precio);
  const protNum = parsePrice(draft.protecciones_precio);
  const incluidos = 1200 + 800 + 3000;
  const total = planNum + protNum + incluidos;

  return (
    <div className="max-w-[85%] rounded-2xl border border-white/10 bg-zinc-800 p-4 text-sm shadow-sm">
      <h4 className="font-semibold text-white">Resumen de tu cotización</h4>

      <div className="mt-3 space-y-3 text-gray-300">
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Datos personales</p>
          <dl className="space-y-1">
            <Row label="Nombre" value={draft.nombre} />
            <Row label="WhatsApp" value={draft.whatsapp} />
            {draft.email && <Row label="Email" value={draft.email} />}
          </dl>
        </section>

        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Plan seleccionado</p>
          <dl className="space-y-1">
            <Row label={draft.plan_seleccionado} value={draft.plan_precio} highlight />
          </dl>
        </section>

        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Protecciones</p>
          <dl className="space-y-1">
            <Row label={draft.protecciones} value={draft.protecciones_precio} />
          </dl>
        </section>

        {draft.descuento_seleccionado && draft.descuento_seleccionado !== 'Ninguno' && (
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Descuento solicitado</p>
            <p className="text-sm text-brand-accent">{draft.descuento_seleccionado}</p>
            <p className="text-xs text-gray-500">Sujeto a verificación por el Sensei</p>
          </section>
        )}

        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Incluido siempre</p>
          <dl className="space-y-1">
            <Row label="Carnet Federación" value="RD$1,200" />
            <Row label="Sello Uniforme" value="RD$800" />
            <Row label="Uniforme Principiante" value="RD$3,000" />
          </dl>
        </section>

        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Total estimado (primer mes)</span>
            <span className="text-lg font-bold text-brand-accent">RD${total.toLocaleString('es-DO')}</span>
          </div>
        </div>

        {draft.acuerdo_pago && (
          <p className="rounded-lg bg-brand-accent/10 px-3 py-2 text-xs font-medium text-brand-accent">
            ✓ Solicita acuerdo de pago
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-400">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? 'text-brand-accent' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
