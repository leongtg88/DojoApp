const WHATSAPP_NUMBER = '18296378733';

type WhatsAppPayload = {
  nombre: string;
  edad: string;
  horario_pref: string;
  programa: string;
  whatsapp: string;
  nota?: string;
};

type CotizacionPayload = {
  nombre: string;
  whatsapp: string;
  email: string;
  plan_seleccionado: string;
  plan_precio: string;
  protecciones: string;
  protecciones_precio: string;
  descuento_seleccionado: string;
  acuerdo_pago: boolean;
};

export function buildWhatsAppLink(data: WhatsAppPayload): string {
  const text = `Hola Sensei, quiero reservar una clase de prueba en Tosei Gusoku.\nNombre: ${data.nombre}.\nEdad: ${data.edad}.\nHorario preferido: ${data.horario_pref}.\nPrograma: ${data.programa}.\nWhatsApp: ${data.whatsapp}.\nNota: ${data.nota || 'Sin notas'}`;

  return buildWhatsAppTextLink(text);
}

export function buildCotizacionLink(data: CotizacionPayload): string {
  return buildWhatsAppTextLink(buildCotizacionText(data));
}

export function buildCotizacionText(data: CotizacionPayload): string {
  const lines = [
    'Hola Sensei, quiero una cotización en Tosei Gusoku 🥋',
    '',
    '👤 Datos:',
    `- Nombre: ${data.nombre}`,
    `- WhatsApp: ${data.whatsapp}`,
  ];

  if (data.email) lines.push(`- Email: ${data.email}`);

  lines.push(
    '',
    `🥋 Plan: ${data.plan_seleccionado} — ${data.plan_precio}`,
  );

  if (data.protecciones.includes('Ambas')) {
    lines.push(
      '',
      '🥊 Protecciones:',
      '  • Guantines manos — RD$2,500',
      '  • Espinilleras pies — RD$2,900',
    );
  } else {
    lines.push(
      '',
      `🥊 Protecciones: ${data.protecciones} — ${data.protecciones_precio}`,
    );
  }

  if (data.descuento_seleccionado && data.descuento_seleccionado !== 'Ninguno') {
    lines.push('', `🏷️ Descuento solicitado: ${data.descuento_seleccionado}`);
  }

  lines.push(
    '',
    '📋 Incluido:',
    '• Carnet Federación: RD$1,200',
    '• Sello Uniforme: RD$800',
    '• Uniforme Principiante: RD$3,000',
  );

  const planNum = Number(data.plan_precio.replace(/[^0-9]/g, ''));
  const protNum = Number(data.protecciones_precio.replace(/[^0-9]/g, ''));
  const total = planNum + protNum + 1200 + 800 + 3000;
  lines.push('', `💰 Total estimado primer mes: RD$${total.toLocaleString('es-DO')}`);

  if (data.acuerdo_pago) lines.push('📝 Necesito acuerdo de pago');

  return lines.join('\n');
}

export function buildEnrollmentWithCotizacionLink(enrollment: WhatsAppPayload, cotizacion: CotizacionPayload): string {
  const enrollmentText = `Hola Sensei, quiero reservar una clase de prueba en Tosei Gusoku.\nNombre: ${enrollment.nombre}.\nEdad: ${enrollment.edad}.\nHorario preferido: ${enrollment.horario_pref}.\nPrograma: ${enrollment.programa}.\nWhatsApp: ${enrollment.whatsapp}.\nNota: ${enrollment.nota || 'Sin notas'}`;

  const cotizacionText = buildCotizacionText(cotizacion);

  return buildWhatsAppTextLink(`${enrollmentText}\n\n---\n\nCotización previa:\n${cotizacionText}`);
}

export function buildWhatsAppTextLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const WA_GENERIC_TEXT = 'Hola Sensei, quiero información sobre las clases de Tosei Gusoku 🙏';
export const WA_QUOTE_TEXT = 'Hola Sensei, me gustaría recibir una cotización de los planes de Tosei Gusoku 🙏';
