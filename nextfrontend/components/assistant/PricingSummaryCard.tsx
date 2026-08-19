import { useState } from 'react';
import type { EnrollmentDraft } from '@/lib/flow';

function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9]/g, '')) || 0;
}

type RowCategory = 'mensualidad' | 'inscripcion' | 'protecciones' | 'carnet' | 'sello' | 'uniforme';

interface BreakdownRow {
  label: string;
  regular: number;
  discounted: number;
  units: number;
  category: RowCategory;
}

function getCarnetTotal(count: number): { regular: number; discounted: number } {
  const base = 1200;
  const half = 600;
  const regular = base * count;
  const discounted = count === 1 ? base : base + half * (count - 1);
  return { regular, discounted };
}

type CountState = { mensualidad: number; uniforme: number; protecciones: number };

function isMultiRowMensualidad(descuento: string): boolean {
  return descuento === 'Padre + hijo 5-7' || descuento === 'Hermanos mixtos (5-7 + 8+)';
}

function getInitialCounts(draft: EnrollmentDraft, hasDiscount: boolean): CountState {
  if (!hasDiscount) {
    return {
      mensualidad: 1,
      uniforme: 1,
      protecciones: draft.protecciones_precio && draft.protecciones_precio !== 'RD$0' ? 1 : 0,
    };
  }
  switch (draft.descuento_seleccionado) {
    case '3 hermanos ambos 5-7':
    case '3 hermanos 8+':
      return { mensualidad: 3, uniforme: 3, protecciones: 3 };
    default:
      return { mensualidad: 2, uniforme: 2, protecciones: 2 };
  }
}

function getMaxCounts(draft: EnrollmentDraft, hasDiscount: boolean): CountState {
  if (!hasDiscount) {
    return { mensualidad: 1, uniforme: 1, protecciones: 1 };
  }
  switch (draft.descuento_seleccionado) {
    case '3 hermanos ambos 5-7':
    case '3 hermanos 8+':
      return { mensualidad: 3, uniforme: 3, protecciones: 3 };
    default:
      return { mensualidad: 2, uniforme: 2, protecciones: 2 };
  }
}

function getDiscountedBreakdown(draft: EnrollmentDraft, counts: CountState): BreakdownRow[] | null {
  const descuento = draft.descuento_seleccionado;
  const protNum = parsePrice(draft.protecciones_precio);
  const sello = 800;
  const uniforme = 3000;
  const inscripcionFull = 3000;
  const m = counts.mensualidad;

  switch (descuento) {
    case '2 hermanos ambos 5-7': {
      const rows: BreakdownRow[] = [];
      if (m > 0) {
        const unitPrice = m >= 2 ? 3200 : 3500;
        rows.push({ label: 'Plan mensual (2 hermanos 5-7)', regular: 3500 * m, discounted: unitPrice * m, units: m, category: 'mensualidad' });
      }
      if (m > 0) {
        const inscDisc = m >= 2 ? inscripcionFull : inscripcionFull * m;
        rows.push({ label: 'Inscripción', regular: inscripcionFull * m, discounted: inscDisc, units: m, category: 'inscripcion' });
      }
      if (counts.protecciones > 0) {
        rows.push({ label: 'Protecciones', regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
      }
      if (m > 0) {
        const carnet = getCarnetTotal(m);
        rows.push({ label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted, units: m, category: 'carnet' });
      }
      if (m > 0) {
        rows.push({ label: 'Sello Uniforme', regular: sello * m, discounted: sello * m, units: m, category: 'sello' });
      }
      if (counts.uniforme > 0) {
        rows.push({ label: 'Uniforme Principiante', regular: uniforme * counts.uniforme, discounted: uniforme * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
      }
      return rows;
    }
    case '3 hermanos ambos 5-7': {
      const rows: BreakdownRow[] = [];
      if (m > 0) {
        const unitPrice = m >= 2 ? 3200 : 3500;
        rows.push({ label: 'Plan mensual (3 hermanos 5-7)', regular: 3500 * m, discounted: unitPrice * m, units: m, category: 'mensualidad' });
      }
      if (m > 0) {
        const inscDisc = m >= 3 ? inscripcionFull * 1.5 : m === 2 ? inscripcionFull : inscripcionFull * m;
        rows.push({ label: 'Inscripción', regular: inscripcionFull * m, discounted: inscDisc, units: m, category: 'inscripcion' });
      }
      if (counts.protecciones > 0) {
        rows.push({ label: 'Protecciones', regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
      }
      if (m > 0) {
        const carnet = getCarnetTotal(m);
        rows.push({ label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted, units: m, category: 'carnet' });
      }
      if (m > 0) {
        rows.push({ label: 'Sello Uniforme', regular: sello * m, discounted: sello * m, units: m, category: 'sello' });
      }
      if (counts.uniforme > 0) {
        rows.push({ label: 'Uniforme Principiante', regular: uniforme * counts.uniforme, discounted: uniforme * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
      }
      return rows;
    }
    case '(2 hermanos 8+) ó (Padre + hijo 8+)': {
      const rows: BreakdownRow[] = [];
      if (m > 0) {
        const unitPrice = m >= 2 ? 3000 : 3300;
        rows.push({ label: 'Plan mensual (2 hermanos/padre+hijo 8+)', regular: 3300 * m, discounted: unitPrice * m, units: m, category: 'mensualidad' });
      }
      if (m > 0) {
        const inscDisc = m >= 2 ? inscripcionFull : inscripcionFull * m;
        rows.push({ label: 'Inscripción', regular: inscripcionFull * m, discounted: inscDisc, units: m, category: 'inscripcion' });
      }
      if (counts.protecciones > 0) {
        rows.push({ label: 'Protecciones', regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
      }
      if (m > 0) {
        const carnet = getCarnetTotal(m);
        rows.push({ label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted, units: m, category: 'carnet' });
      }
      if (m > 0) {
        rows.push({ label: 'Sello Uniforme', regular: sello * m, discounted: sello * m, units: m, category: 'sello' });
      }
      if (counts.uniforme > 0) {
        rows.push({ label: 'Uniforme Principiante', regular: uniforme * counts.uniforme, discounted: uniforme * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
      }
      return rows;
    }
    case '3 hermanos 8+': {
      const rows: BreakdownRow[] = [];
      if (m > 0) {
        const unitPrice = m >= 2 ? 3000 : 3300;
        rows.push({ label: 'Plan mensual (3 hermanos 8+)', regular: 3300 * m, discounted: unitPrice * m, units: m, category: 'mensualidad' });
      }
      if (m > 0) {
        const inscDisc = m >= 3 ? inscripcionFull * 1.5 : m === 2 ? inscripcionFull : inscripcionFull * m;
        rows.push({ label: 'Inscripción', regular: inscripcionFull * m, discounted: inscDisc, units: m, category: 'inscripcion' });
      }
      if (counts.protecciones > 0) {
        rows.push({ label: 'Protecciones', regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
      }
      if (m > 0) {
        const carnet = getCarnetTotal(m);
        rows.push({ label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted, units: m, category: 'carnet' });
      }
      if (m > 0) {
        rows.push({ label: 'Sello Uniforme', regular: sello * m, discounted: sello * m, units: m, category: 'sello' });
      }
      if (counts.uniforme > 0) {
        rows.push({ label: 'Uniforme Principiante', regular: uniforme * counts.uniforme, discounted: uniforme * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
      }
      return rows;
    }
    case 'Padre + hijo 5-7': {
      const rows: BreakdownRow[] = [];
      rows.push({ label: 'Plan mensual (padre 8+)', regular: 3300, discounted: 3000, units: 1, category: 'mensualidad' });
      rows.push({ label: 'Plan mensual (hijo 5-7)', regular: 3500, discounted: 3200, units: 1, category: 'mensualidad' });
      rows.push({ label: 'Inscripción', regular: inscripcionFull * 2, discounted: inscripcionFull, units: 2, category: 'inscripcion' });
      if (counts.protecciones > 0) {
        rows.push({ label: 'Protecciones', regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
      }
      const carnet = getCarnetTotal(2);
      rows.push({ label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted, units: 2, category: 'carnet' });
      rows.push({ label: 'Sello Uniforme', regular: sello * 2, discounted: sello * 2, units: 2, category: 'sello' });
      if (counts.uniforme > 0) {
        rows.push({ label: 'Uniforme Principiante', regular: uniforme * counts.uniforme, discounted: uniforme * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
      }
      return rows;
    }
    case 'Hermanos mixtos (5-7 + 8+)': {
      const rows: BreakdownRow[] = [];
      rows.push({ label: 'Plan mensual (hermano 5-7)', regular: 3500, discounted: 3200, units: 1, category: 'mensualidad' });
      rows.push({ label: 'Plan mensual (hermano 8+)', regular: 3300, discounted: 3000, units: 1, category: 'mensualidad' });
      rows.push({ label: 'Inscripción', regular: inscripcionFull * 2, discounted: inscripcionFull, units: 2, category: 'inscripcion' });
      if (counts.protecciones > 0) {
        rows.push({ label: 'Protecciones', regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
      }
      const carnet = getCarnetTotal(2);
      rows.push({ label: 'Carnet Federación', regular: carnet.regular, discounted: carnet.discounted, units: 2, category: 'carnet' });
      rows.push({ label: 'Sello Uniforme', regular: sello * 2, discounted: sello * 2, units: 2, category: 'sello' });
      if (counts.uniforme > 0) {
        rows.push({ label: 'Uniforme Principiante', regular: uniforme * counts.uniforme, discounted: uniforme * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
      }
      return rows;
    }
    default:
      return null;
  }
}

function getRegularBreakdown(draft: EnrollmentDraft, counts: CountState): BreakdownRow[] {
  const planNum = parsePrice(draft.plan_precio);
  const protNum = parsePrice(draft.protecciones_precio);
  const rows: BreakdownRow[] = [];

  if (counts.mensualidad > 0) {
    rows.push({ label: draft.plan_seleccionado, regular: planNum * counts.mensualidad, discounted: planNum * counts.mensualidad, units: counts.mensualidad, category: 'mensualidad' });
  }
  if (counts.protecciones > 0) {
    rows.push({ label: draft.protecciones, regular: protNum * counts.protecciones, discounted: protNum * counts.protecciones, units: counts.protecciones, category: 'protecciones' });
  }
  if (counts.mensualidad > 0) {
    rows.push({ label: 'Carnet Federación', regular: 1200 * counts.mensualidad, discounted: 1200 * counts.mensualidad, units: counts.mensualidad, category: 'carnet' });
  }
  if (counts.mensualidad > 0) {
    rows.push({ label: 'Sello Uniforme', regular: 800 * counts.mensualidad, discounted: 800 * counts.mensualidad, units: counts.mensualidad, category: 'sello' });
  }
  if (counts.uniforme > 0) {
    rows.push({ label: 'Uniforme Principiante', regular: 3000 * counts.uniforme, discounted: 3000 * counts.uniforme, units: counts.uniforme, category: 'uniforme' });
  }
  return rows;
}

function Stepper({ label, count, max, onChange }: { label: string; count: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={count <= 0}
          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-4 text-center text-xs font-medium text-white">{count}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, count + 1))}
          disabled={count >= max}
          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

const BTN_CLS = 'flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-30';

export default function PricingSummaryCard({ draft }: { draft: EnrollmentDraft }) {
  const hasDiscount = draft.descuento_seleccionado && draft.descuento_seleccionado !== 'Ninguno';
  const descuento = draft.descuento_seleccionado ?? '';
  const initialCounts = getInitialCounts(draft, hasDiscount);
  const maxCounts = getMaxCounts(draft, hasDiscount);
  const hasProtecciones = draft.protecciones_precio && draft.protecciones_precio !== 'RD$0';
  const multiRow = hasDiscount && isMultiRowMensualidad(descuento);

  const [mensualidadCount, setMensualidadCount] = useState(initialCounts.mensualidad);
  const [uniformeCount, setUniformeCount] = useState(initialCounts.uniforme);
  const [proteccionCount, setProteccionCount] = useState(initialCounts.protecciones);
  const [hiddenMensualidades, setHiddenMensualidades] = useState<Set<string>>(new Set());

  const toggleMensualidad = (label: string) => {
    setHiddenMensualidades((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  let rows = hasDiscount
    ? getDiscountedBreakdown(draft, { mensualidad: multiRow ? 2 : mensualidadCount, uniforme: uniformeCount, protecciones: proteccionCount })
    : getRegularBreakdown(draft, { mensualidad: mensualidadCount, uniforme: uniformeCount, protecciones: proteccionCount });

  if (multiRow && rows) {
    const visibleMensualidades = rows.filter((r) => r.category === 'mensualidad' && !hiddenMensualidades.has(r.label));
    const vmCount = visibleMensualidades.length;

    rows = rows
      .filter((r) => {
        if (r.category === 'mensualidad') return !hiddenMensualidades.has(r.label);
        if (r.category === 'inscripcion' || r.category === 'carnet') return vmCount > 0;
        return true;
      })
      .map((r) => {
        if (r.category === 'mensualidad' && vmCount === 1) {
          const fullPrice = r.regular;
          return { ...r, discounted: fullPrice };
        }
        if (r.category === 'inscripcion') {
          const inscripcionFull = 3000;
          const inscDisc = vmCount >= 2 ? inscripcionFull : inscripcionFull * vmCount;
          return { ...r, regular: inscripcionFull * vmCount, discounted: inscDisc, units: vmCount };
        }
        if (r.category === 'carnet') {
          const carnet = getCarnetTotal(vmCount);
          return { ...r, regular: carnet.regular, discounted: carnet.discounted, units: vmCount };
        }
        if (r.category === 'sello') {
          return { ...r, regular: 800 * vmCount, discounted: 800 * vmCount, units: vmCount };
        }
        return r;
      });
  }

  const totalRegular = rows?.reduce((sum, r) => sum + r.regular, 0) ?? 0;
  const totalDiscounted = rows?.reduce((sum, r) => sum + r.discounted, 0) ?? 0;
  const totalSegundoMes = rows?.filter((r) => r.category === 'mensualidad').reduce((sum, r) => sum + r.discounted, 0) ?? 0;
  const savings = totalRegular - totalDiscounted;
  const savingsSegundoMes = rows?.filter((r) => r.category === 'mensualidad').reduce((sum, r) => sum + (r.regular - r.discounted), 0) ?? 0;

  const hiddenMensualidadRows = multiRow
    ? (getDiscountedBreakdown(draft, { mensualidad: 2, uniforme: 0, protecciones: 0 }) ?? []).filter(
        (r) => r.category === 'mensualidad' && hiddenMensualidades.has(r.label),
      )
    : [];

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

          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-gray-400">
                  <th className="px-2 py-1.5 font-medium">Concepto</th>
                  <th className="px-2 py-1.5 text-center font-medium">Cant.</th>
                  {hasDiscount && <th className="px-2 py-1.5 text-right font-medium">Original</th>}
                  <th className="px-2 py-1.5 text-right font-medium">Final</th>
                  {multiRow && <th className="w-8" />}
                </tr>
              </thead>
              <tbody>
                {rows?.map((r) => (
                  <tr key={r.label} className="border-b border-white/5">
                    <td className="px-2 py-1.5 text-gray-300">{r.label}</td>
                    <td className="px-2 py-1.5 text-center font-medium text-white">{r.units}</td>
                    {hasDiscount && (
                      <td className={`px-2 py-1.5 text-right ${r.regular !== r.discounted ? 'text-gray-500 line-through' : 'text-gray-500'}`}>
                        RD${r.regular.toLocaleString('es-DO')}
                      </td>
                    )}
                    <td className="px-2 py-1.5 text-right font-medium text-white">
                      RD${r.discounted.toLocaleString('es-DO')}
                    </td>
                    {multiRow && r.category === 'mensualidad' && (
                      <td className="px-1 py-1.5 text-center">
                        <button type="button" onClick={() => toggleMensualidad(r.label)} className={BTN_CLS}>
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Ajustar cantidades</p>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3">
            {multiRow ? (
              <>
                {hiddenMensualidadRows.length > 0 && (
                  <>
                    {hiddenMensualidadRows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-500 line-through">{r.label}</span>
                        <button type="button" onClick={() => toggleMensualidad(r.label)} className={BTN_CLS}>
                          +
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-white/5" />
                  </>
                )}
              </>
            ) : (
              <>
                <Stepper label="Mensualidades" count={mensualidadCount} max={maxCounts.mensualidad} onChange={setMensualidadCount} />
                <div className="border-t border-white/5" />
              </>
            )}
            <Stepper label="Uniformes" count={uniformeCount} max={maxCounts.uniforme} onChange={setUniformeCount} />
            {hasProtecciones && (
              <>
                <div className="border-t border-white/5" />
                <Stepper label="Protecciones" count={proteccionCount} max={maxCounts.protecciones} onChange={setProteccionCount} />
              </>
            )}
          </div>
        </section>

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
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total (segundo mes)</span>
            <span className="text-sm font-semibold text-white">
              RD${totalSegundoMes.toLocaleString('es-DO')}
            </span>
          </div>
            {hasDiscount && savingsSegundoMes > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-400">Ahorro mensual</span>
              <span className="text-sm font-bold text-green-400">-RD${savingsSegundoMes.toLocaleString('es-DO')}</span>
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
