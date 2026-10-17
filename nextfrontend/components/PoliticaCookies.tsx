import { ManageCookiesButton } from '@/components/consent/ManageCookiesButton';

interface CookieRow {
  name: string;
  type: 'Necesaria' | 'Analítica' | 'Marketing';
  provider: string;
  purpose: string;
  duration: string;
}

const COOKIES: CookieRow[] = [
  {
    name: 'authjs.session-token',
    type: 'Necesaria',
    provider: 'Propia',
    purpose: 'Mantiene tu sesión iniciada de forma segura.',
    duration: '30 días',
  },
  {
    name: 'authjs.csrf-token',
    type: 'Necesaria',
    provider: 'Propia',
    purpose: 'Protege el inicio de sesión contra ataques CSRF.',
    duration: '30 días',
  },
  {
    name: 'authjs.callback-url',
    type: 'Necesaria',
    provider: 'Propia',
    purpose: 'Recuerda a dónde redirigirte tras iniciar sesión.',
    duration: '30 días',
  },
  {
    name: 'dojo_wa_challenge',
    type: 'Necesaria',
    provider: 'Propia',
    purpose: 'Desafío temporal para el acceso por huella / Face ID (WebAuthn).',
    duration: '5 minutos',
  },
  {
    name: 'dojo_wa_ticket',
    type: 'Necesaria',
    provider: 'Propia',
    purpose: 'Ticket temporal que completa el acceso por huella / Face ID.',
    duration: '2 minutos',
  },
  {
    name: 'dojo_consent',
    type: 'Necesaria',
    provider: 'Propia',
    purpose: 'Guarda tu elección sobre las cookies.',
    duration: '12 meses',
  },
  {
    name: '_ga, _ga_*',
    type: 'Analítica',
    provider: 'Google Analytics',
    purpose: 'Mide de forma agregada cómo se usa la Plataforma para mejorarla.',
    duration: 'Hasta 2 años',
  },
  {
    name: '_fbp, _fbc',
    type: 'Marketing',
    provider: 'Meta (Facebook)',
    purpose: 'Mide la eficacia de nuestras campañas publicitarias.',
    duration: 'Hasta 90 días',
  },
];

const TYPE_STYLES: Record<CookieRow['type'], string> = {
  Necesaria: 'bg-gray-100 text-gray-700',
  Analítica: 'bg-blue-100 text-blue-800',
  Marketing: 'bg-amber-100 text-amber-800',
};

export default function PoliticaCookies({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'}>
      <div className={embedded ? '' : 'max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden'}>
        {/* Encabezado */}
        <div className="bg-teal-700 px-6 py-8 sm:px-10">
          <h1 className="text-3xl font-bold text-white text-center sm:text-4xl">
            Política de Cookies
          </h1>
          <p className="text-center text-teal-100 mt-2 text-sm sm:text-base">
            TOSEI GUSOKU DOJO CLUB · Shitoryu Karate Do
          </p>
          <p className="text-center text-teal-200 text-xs mt-1">
            Versión 2026-v1 · Aplicable a la plataforma web y app móvil
          </p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 text-gray-800 space-y-8">

          {/* Introducción */}
          <div className="text-sm text-gray-600 border-b border-gray-200 pb-4">
            <p>
              Esta Política de Cookies explica qué son las cookies, cuáles usamos en la
              Plataforma de <strong>TOSEI GUSOKU DOJO CLUB</strong> y cómo puedes
              controlarlas. Complementa nuestra{' '}
              <a href="/privacidad" className="text-teal-700 hover:underline">Política de Privacidad</a>{' '}
              y se emite conforme a la <strong>Ley No. 172-13</strong> sobre Protección
              de Datos Personales de la República Dominicana.
            </p>
          </div>

          {/* 1. Qué son las cookies */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              ¿Qué son las cookies?
            </h2>
            <p className="text-sm sm:text-base pl-2">
              Las cookies son pequeños archivos que se guardan en tu dispositivo al
              navegar. Permiten que el sitio recuerde tus acciones y preferencias
              (por ejemplo, mantener tu sesión iniciada). También usamos tecnologías
              similares como el almacenamiento local del navegador.
            </p>
          </section>

          {/* 2. Tipos y base legal */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
              Tipos de cookies que usamos y base legal
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>2.1. Necesarias o funcionales:</strong> imprescindibles para que la Plataforma funcione y para tu seguridad (inicio de sesión, protección contra fraudes y acceso por huella / Face ID). Se activan siempre y no requieren consentimiento, por estar exentas al ser estrictamente necesarias.</p>
              <p><strong>2.2. Analíticas:</strong> nos permiten medir de forma agregada cómo se usa la Plataforma para mejorarla (Google Analytics). <strong>Solo se activan si otorgas tu consentimiento.</strong></p>
              <p><strong>2.3. De marketing:</strong> permiten medir la eficacia de nuestras campañas publicitarias (Meta Pixel). <strong>Solo se activan si otorgas tu consentimiento.</strong></p>
              <p className="text-gray-600">Las cookies no esenciales permanecen desactivadas hasta que aceptas o habilitas su categoría. Puedes retirar tu consentimiento en cualquier momento (ver sección 5).</p>
            </div>
          </section>

          {/* 3. Tabla de cookies */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
              Detalle de las cookies
            </h2>
            <div className="overflow-x-auto pl-2">
              <table className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Cookie</th>
                    <th className="text-left px-3 py-2 font-semibold">Tipo</th>
                    <th className="text-left px-3 py-2 font-semibold">Proveedor</th>
                    <th className="text-left px-3 py-2 font-semibold">Finalidad</th>
                    <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {COOKIES.map((cookie) => (
                    <tr key={cookie.name}>
                      <td className="px-3 py-2 font-mono text-[11px] sm:text-xs text-gray-800 align-top">{cookie.name}</td>
                      <td className="px-3 py-2 align-top">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[cookie.type]}`}>
                          {cookie.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 align-top">{cookie.provider}</td>
                      <td className="px-3 py-2 text-gray-600 align-top">{cookie.purpose}</td>
                      <td className="px-3 py-2 text-gray-600 align-top whitespace-nowrap">{cookie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Cookies de terceros */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
              Cookies de terceros
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p>Algunas cookies son gestionadas por proveedores externos cuando aceptas su categoría:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Google Analytics:</strong> medición de uso. Puedes consultar su política en <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">policies.google.com/privacy</a>.</li>
                <li><strong>Meta Pixel (Facebook):</strong> medición de campañas. Puedes consultar su política en <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">facebook.com/privacy/policy</a>.</li>
              </ul>
              <p className="text-gray-600">Un proveedor externo fuera de la República Dominicana puede implicar una transferencia internacional de datos; aplicamos las salvaguardas descritas en la Política de Privacidad.</p>
            </div>
          </section>

          {/* 5. Cómo gestionarlas */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">5</span>
              Cómo aceptar, rechazar o cambiar tu elección
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>5.1.</strong> Puedes aceptar todas las cookies, rechazar las no esenciales o configurarlas por categoría desde el aviso que aparece al entrar.</p>
              <p><strong>5.2.</strong> Para cambiar tu decisión más adelante, usa el botón <strong>«Gestionar cookies»</strong> que aparece aquí abajo y en el pie de página del sitio.</p>
              <div className="pt-1">
                <ManageCookiesButton className="inline-flex rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-800" />
              </div>
              <p><strong>5.3.</strong> También puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox, Edge, etc.). Ten en cuenta que si desactivas las cookies necesarias, algunas funciones —como iniciar sesión o el acceso por huella— podrían no funcionar.</p>
            </div>
          </section>

          {/* 6. Actualizaciones */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">6</span>
              Actualizaciones de esta Política
            </h2>
            <p className="text-sm sm:text-base pl-2">
              Podemos actualizar esta Política de Cookies para reflejar cambios en
              las cookies que usamos o en la legislación aplicable. Publicaremos la
              versión vigente en esta página con su fecha de revisión.
            </p>
          </section>

          {/* 7. Contacto */}
          <section>
            <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">7</span>
              Contacto
            </h2>
            <p className="text-sm sm:text-base pl-2">
              Para cualquier duda sobre esta política, escríbenos a{' '}
              <a href="mailto:toseigusoku@gmail.com" className="text-teal-700 hover:underline">toseigusoku@gmail.com</a>{' '}
              o por WhatsApp al{' '}
              <a href="https://wa.me/18296378733" className="text-teal-700 hover:underline">829-637-8733</a>.
            </p>
          </section>

          {/* Pie de página */}
          <div className="border-t border-gray-200 pt-6 mt-4 text-xs text-gray-500 text-center">
            <p>© {new Date().getFullYear()} TOSEI GUSOKU DOJO CLUB · Todos los derechos reservados.</p>
            <p className="mt-1">Versión 2026-v1 · Última actualización: {new Date().toLocaleDateString('es-DO')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
