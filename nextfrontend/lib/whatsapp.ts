const WHATSAPP_NUMBER = '18296378733';

type WhatsAppPayload = {
  nombre: string;
  edad: string;
  horario_pref: string;
  programa: string;
  whatsapp: string;
  nota?: string;
};

export function buildWhatsAppLink(data: WhatsAppPayload): string {
  const text = `Hola Sensei, quiero reservar una clase de prueba en Tosei Gusoku.\nNombre: ${data.nombre}.\nEdad: ${data.edad}.\nHorario preferido: ${data.horario_pref}.\nPrograma: ${data.programa}.\nWhatsApp: ${data.whatsapp}.\nNota: ${data.nota || 'Sin notas'}`;

  return buildWhatsAppTextLink(text);
}

export function buildWhatsAppTextLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const WA_GENERIC_TEXT = 'Hola Sensei, quiero información sobre las clases de Tosei Gusoku 🙏';
export const WA_QUOTE_TEXT = 'Hola Sensei, me gustaría recibir una cotización de los planes de Tosei Gusoku 🙏';
