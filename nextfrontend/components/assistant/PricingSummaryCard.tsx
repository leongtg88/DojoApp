import { useState } from 'react';
import type { EnrollmentDraft } from '@/lib/flow';

function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9]/g, '')) || 0;
}

interface BreakdownRow {
  label: string;
  regular: number;
  discounted: number;
}

function getCarnetTotal(count: number): { regular: number; discounted: number } {
  const base = 1200;
  const half = 600;
  const regular = base * count;
  const discounted = base + half * (count - 1);
  return { regular, discounted };
}

function getDiscountedBreakdown(draft: EnrollmentDraft, includeProtecciones: boolean): BreakdownRow[] | null {
  const descuento = draft.descuento_seleccionado;
  const protNum = parsePrice(draft.protecciones_precio);
  const sello = 800;
  const uniforme = 3000;
  const inscripcionFull = 3000;

  switch (descuento) {
    case '2 hermanos ambos 5-7': {
      const carnet = getCarnetTotal(2);
      return [
        { label: 'Plan mensual (2 hermanos 5-7)', regular: 3800 * 2, discounted: 3500 * 2 },
        { label: 'Inscripción', regular: inscripcionFull * 2, discounted: inscripcionFull },
        ...(includeProtecciones ? [{ label: 'Protecciones', regular: protNum * 2, discounted: protNum * 2 }] : []),
        { label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted },
        { label: 'Sello Uniforme', regular: sello * 2, discounted: sello * 2 },
        { label: 'Uniforme Principiante', regular: uniforme * 2, discounted: uniforme * 2 },
      ];
    }
    case '3 hermanos ambos 5-7': {
      const carnet = getCarnetTotal(3);
      return [
        { label: 'Plan mensual (3 hermanos 5-7)', regular: 3800 * 3, discounted: 3200 * 3 },
        { label: 'Inscripción', regular: inscripcionFull * 3, discounted: inscripcionFull * 1.5 },
        ...(includeProtecciones ? [{ label: 'Protecciones', regular: protNum * 3, discounted: protNum * 3 }] : []),
        { label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted },
        { label: 'Sello Uniforme', regular: sello * 3, discounted: sello * 3 },
        { label: 'Uniforme Principiante', regular: uniforme * 3, discounted: uniforme * 3 },
      ];
    }
    case '2 hermanos 8+ / Padre+hijo 8+': {
      const carnet = getCarnetTotal(2);
      return [
        { label: 'Plan mensual (2 hermanos/padre+hijo 8+)', regular: 3300 * 2, discounted: 3000 * 2 },
        { label: 'Inscripción', regular: inscripcionFull * 2, discounted: inscripcionFull },
        ...(includeProtecciones ? [{ label: 'Protecciones', regular: protNum * 2, discounted: protNum * 2 }] : []),
        { label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted },
        { label: 'Sello Uniforme', regular: sello * 2, discounted: sello * 2 },
        { label: 'Uniforme Principiante', regular: uniforme * 2, discounted: uniforme * 2 },
      ];
    }
    case '3 hermanos 8+': {
      const carnet = getCarnetTotal(3);
      return [
        { label: 'Plan mensual (3 hermanos 8+)', regular: 3300 * 3, discounted: 3000 * 3 },
        { label: 'Inscripción', regular: inscripcionFull * 3, discounted: inscripcionFull * 1.5 },
        ...(includeProtecciones ? [{ label: 'Protecciones', regular: protNum * 3, discounted: protNum * 3 }] : []),
        { label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted },
        { label: 'Sello Uniforme', regular: sello * 3, discounted: sello * 3 },
        { label: 'Uniforme Principiante', regular: uniforme * 3, discounted: uniforme * 3 },
      ];
    }
    case 'Padre + hijo 5-7': {
      const carnet = getCarnetTotal(2);
      return [
        { label: 'Plan mensual (padre 8+)', regular: 3300, discounted: 3200 },
        { label: 'Plan mensual (hijo 5-7)', regular: 3800, discounted: 3200 },
        { label: 'Inscripción', regular: inscripcionFull * 2, discounted: inscripcionFull },
        ...(includeProtecciones ? [{ label: 'Protecciones', regular: protNum * 2, discounted: protNum * 2 }] : []),
        { label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted },
        { label: 'Sello Uniforme', regular: sello * 2, discounted: sello * 2 },
        { label: 'Uniforme Principiante', regular: uniforme * 2, discounted: uniforme * 2 },
      ];
    }
    case 'Hermanos mixtos (5-7 + 8+)': {
      const carnet = getCarnetTotal(2);
      return [
        { label: 'Plan mensual (hermano 5-7)', regular: 3800, discounted: 3800 },
        { label: 'Plan mensual (hermano 8+)', regular: 3300, discounted: 3300 },
        { label: 'Inscripción', regular: inscripcionFull * 2, discounted: inscripcionFull },
        ...(includeProtecciones ? [{ label: 'Protecciones', regular: protNum * 2, discounted: protNum * 2 }] : []),
        { label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted },
        { label: 'Sello Uniforme', regular: sello * 2, discounted: sello * 2 },
        { label: 'Uniforme Principiante', regular: uniforme * 2, discounted: uniforme * 2 },
      ];
    }
    default:
      return null;
  }
}

function getRegularBreakdown(draft: EnrollmentDraft, includeProtecciones: boolean): BreakdownRow[] {
  const planNum = parsePrice(draft.plan_precio);
  const protNum = parsePrice(draft.protecciones_precio);

  return [
    { label: draft.plan_seleccionado, regular: planNum, discounted: planNum },
    ...(includeProtecciones ? [{ label: draft.protecciones, regular: protNum, discounted: protNum }] : []),
    { label: 'Carnet Federación', regular: 1200, discounted: 1200 },
    { label: 'Sello Uniforme', regular: 800, discounted: 800 },
    { label: 'Uniforme Principiante', regular: 3000, discounted: 3000 },
  ];
}

export default function PricingSummaryCard({ draft }: { draft: EnrollmentDraft }) {
  const [includeProtecciones, setIncludeProtecciones] = useState(true);
  const hasDiscount = draft.descuento_seleccionado && draft.descuento_seleccionado !== 'Ninguno';
  const rows = hasDiscount
    ? getDiscountedBreakdown(draft, includeProtecciones)
    : getRegularBreakdown(draft, includeProtecciones);

  const totalRegular = rows?.reduce((sum, r) => sum + r.regular, 0) ?? 0;
  const totalDiscounted = rows?.reduce((sum, r) => sum + r.discounted, 0) ?? 0;
  const savings = totalRegular - totalDiscounted;

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

        {hasDiscount && (
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Descuento aplicado</p>
            <p className="text-sm text-green-400">{draft.descuento_seleccionado}</p>
            <p className="text-xs text-gray-500">Sujeto a verificación por el Sensei</p>
          </section>
        )}

        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {hasDiscount ? 'Desglose familiar' : 'Desglose'}
          </p>

          {hasDiscount ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-left text-gray-400">
                    <th className="px-2 py-1.5 font-medium">Concepto</th>
                    <th className="px-2 py-1.5 text-right font-medium">Original</th>
                    <th className="px-2 py-1.5 text-right font-medium">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {rows?.map((r) => (
                    <tr key={r.label} className="border-b border-white/5">
                      <td className="px-2 py-1.5 text-gray-300">{r.label}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500 line-through">
                        {r.regular !== r.discounted ? `RD$${r.regular.toLocaleString('es-DO')}` : ''}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium text-white">
                        RD$${r.discounted.toLocaleString('es-DO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <dl className="space-y-1">
              {rows?.map((r) => (
                <Row key={r.label} label={r.label} value={`RD$${r.discounted.toLocaleString('es-DO')}`} />
              ))}
            </dl>
          )}
        </section>

        {draft.protecciones_precio && draft.protecciones_precio !== 'RD$0' && (
          <button
            onClick={() => setIncludeProtecciones(!includeProtecciones)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10"
          >
            {includeProtecciones ? '✕ Quitar protecciones' : '+ Agregar protecciones'}
          </button>
        )}

        <div className="border-t border-white/10 pt-2 space-y-1">
          {hasDiscount && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 line-through">Sin descuento</span>
              <span className="text-xs text-gray-500 line-through">RD${totalRegular.toLocaleString('es-DO')}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Total (primer mes)</span>
            <span className={`text-lg font-bold ${hasDiscount ? 'text-green-400' : 'text-brand-accent'}`}>
              RD${totalDiscounted.toLocaleString('es-DO')}
            </span>
          </div>
          {hasDiscount && savings > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-400">Ahorras</span>
              <span className="text-sm font-bold text-green-400">-RD${savings.toLocaleString('es-DO')}</span>
            </div>
          )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}
