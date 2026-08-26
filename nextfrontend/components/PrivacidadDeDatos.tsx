// app/privacidad/page.jsx (o pages/privacidad.js en Pages Router)
export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-blue-800 px-6 py-8 sm:px-10">
          <h1 className="text-3xl font-bold text-white text-center sm:text-4xl">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-center text-blue-100 mt-2 text-sm sm:text-base">
            TOSEI GUSOKU DOJO CLUB · Shitoryu Karate Do
          </p>
          <p className="text-center text-blue-200 text-xs mt-1">
            Versión 2026-v1 · Aplicable a la plataforma web y app móvil
          </p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 text-gray-800 space-y-8">

          {/* Introducción */}
          <div className="text-sm text-gray-600 border-b border-gray-200 pb-4">
            <p>
              En <strong>TOSEI GUSOKU DOJO CLUB</strong> (en adelante, “la Escuela” o “nosotros”) 
              nos comprometemos a proteger la privacidad de los usuarios de nuestra plataforma web 
              y aplicación móvil (en adelante, “la Plataforma”). Esta Política de Privacidad explica 
              cómo recopilamos, usamos, almacenamos y protegemos tus datos personales, así como los 
              derechos que te asisten en virtud de la <strong>Ley No. 172-13 sobre Protección de Datos 
              Personales de la República Dominicana</strong> y normativas aplicables.
            </p>
            <p className="mt-2">
              Al registrarte, iniciar sesión y utilizar la Plataforma, aceptas las prácticas descritas 
              en este documento. Si no estás de acuerdo, por favor no uses nuestros servicios.
            </p>
          </div>

          {/* 1. Responsable del Tratamiento */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              Responsable del Tratamiento
            </h2>
            <p className="text-sm sm:text-base pl-2">
              <strong>TOSEI GUSOKU DOJO CLUB</strong>, con domicilio en República Dominicana, 
              es el responsable del tratamiento de los datos personales que se recogen a través de 
              la Plataforma. Puedes contactarnos en <a href="mailto:toseigusoku@gmail.com" className="text-blue-600 hover:underline">toseigusoku@gmail.com</a> 
              o al teléfono <a href="https://wa.me/18296378733" className="text-blue-600 hover:underline">829-637-8733</a> 
              para cualquier consulta relacionada con esta política.
            </p>
          </section>

          {/* 2. Datos que Recopilamos */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
              Datos Personales que Recopilamos
            </h2>
            <div className="space-y-3 text-sm sm:text-base pl-2">
              <p><strong>2.1. Datos de registro y perfil:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Nombre completo, fecha de nacimiento, cédula de identidad o pasaporte.</li>
                <li>Dirección de correo electrónico y número de teléfono (para comunicación y recuperación de cuenta).</li>
                <li>Nombre de usuario y contraseña (almacenada de forma segura y hasheada).</li>
                <li>Foto de perfil (opcional) y, en su caso, fotografía tipo carnet para el carnet federativo.</li>
              </ul>
              <p><strong>2.2. Datos de salud (sensibles):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Información sobre condiciones médicas, alergias, lesiones o discapacidades que puedan influir en la práctica de Karate Do.</li>
                <li>Estos datos solo se recopilan con tu consentimiento expreso y se utilizan para garantizar tu seguridad durante el entrenamiento.</li>
              </ul>
              <p><strong>2.3. Datos de uso y técnicos:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Dirección IP, tipo de dispositivo, sistema operativo, navegador y versión.</li>
                <li>Registros de acceso (logs) con fechas y horas de inicio de sesión.</li>
                <li>Interacciones con la Plataforma (páginas visitadas, clics, tiempo de sesión).</li>
                <li>Cookies y tecnologías similares (ver sección 7).</li>
              </ul>
              <p><strong>2.4. Datos de pago:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Historial de pagos y comprobantes de transferencia.</li>
                <li><em>No almacenamos datos de tarjetas de crédito/débito;</em> los procesamientos se realizan a través de pasarelas de pago externas (ej. Banca en línea, transferencias).</li>
              </ul>
              <p><strong>2.5. Datos de menores de edad:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Para alumnos menores de 18 años, recopilamos los datos del padre, madre o representante legal, incluyendo su identificación y consentimiento.</li>
              </ul>
            </div>
          </section>

          {/* 3. Finalidades del Tratamiento */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
              Finalidades del Tratamiento
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>3.1.</strong> Gestionar tu registro, membresía y acceso a la Plataforma.</p>
              <p><strong>3.2.</strong> Administrar tu inscripción a clases, horarios, pagos y asistencia.</p>
              <p><strong>3.3.</strong> Comunicarnos contigo sobre avisos, cambios de horarios, eventos y promociones (siempre con tu consentimiento previo).</p>
              <p><strong>3.4.</strong> Tramitar tu carnet federativo ante la Federación Dominicana de Karate.</p>
              <p><strong>3.5.</strong> Garantizar la seguridad durante la práctica, adaptando los entrenamientos según tus condiciones de salud.</p>
              <p><strong>3.6.</strong> Mejorar nuestros servicios mediante análisis de uso y preferencias.</p>
              <p><strong>3.7.</strong> Cumplir con obligaciones legales y regulatorias (ej. conservación de documentos, respuesta a autoridades).</p>
              <p><strong>3.8.</strong> Realizar actividades promocionales, fotografías y vídeos (con tu autorización expresa) dentro del ámbito educativo y publicitario de la Escuela.</p>
            </div>
          </section>

          {/* 4. Base Legal para el Tratamiento */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
              Base Legal para el Tratamiento
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>4.1.</strong> <strong>Consentimiento:</strong> Al registrarte, das tu consentimiento explícito para el tratamiento de tus datos personales y sensibles (salud) conforme a esta política.</p>
              <p><strong>4.2.</strong> <strong>Ejecución de un contrato:</strong> El tratamiento es necesario para la ejecución del contrato de membresía y prestación de servicios educativos.</p>
              <p><strong>4.3.</strong> <strong>Cumplimiento de obligaciones legales:</strong> Para dar cumplimiento a normas tributarias, laborales o de seguridad social, y ante requerimientos judiciales.</p>
              <p><strong>4.4.</strong> <strong>Interés legítimo:</strong> Para la mejora continua de nuestros servicios, seguridad de la Plataforma y prevención de fraudes.</p>
            </div>
          </section>

          {/* 5. Conservación de Datos */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">5</span>
              Conservación de Datos
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>5.1.</strong> Los datos se conservarán mientras mantengas una membresía activa y hasta <strong>veinticuatro (24) meses</strong> después de tu baja, salvo que una ley exija un plazo mayor o exista un procedimiento judicial en curso.</p>
              <p><strong>5.2.</strong> Los datos de salud se conservarán exclusivamente durante el período necesario para garantizar tu seguridad y serán eliminados una vez finalizada tu membresía, a menos que exista obligación legal de conservación.</p>
              <p><strong>5.3.</strong> Los datos de uso y logs de acceso se conservarán por un período máximo de 12 meses con fines de auditoría y seguridad.</p>
              <p><strong>5.4.</strong> Una vez expirados los plazos, tus datos serán eliminados de forma segura o anonimizados para que no puedan identificarte.</p>
            </div>
          </section>

          {/* 6. Compartición con Terceros */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">6</span>
              Compartición con Terceros
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>6.1.</strong> <strong>Federación Dominicana de Karate:</strong> Tus datos básicos (nombre, cédula, foto) serán enviados exclusivamente para la emisión de tu carnet federativo.</p>
              <p><strong>6.2.</strong> <strong>Procesadores de pago:</strong> Compartimos datos necesarios (nombre, monto, referencia) con las entidades bancarias o pasarelas de pago para la gestión de cobros. No almacenamos datos de tarjetas.</p>
              <p><strong>6.3.</strong> <strong>Proveedores de servicios tecnológicos:</strong> Podemos contratar servicios de hosting, análisis de datos, notificaciones push, etc., siempre bajo acuerdos de confidencialidad y cumplimiento de la normativa.</p>
              <p><strong>6.4.</strong> <strong>No vendemos ni alquilamos</strong> tus datos personales a terceros con fines comerciales ajenos a la Escuela.</p>
              <p><strong>6.5.</strong> <strong>Transferencias internacionales:</strong> En caso de que algún proveedor esté fuera de la República Dominicana, aseguramos que dicho país ofrece un nivel de protección adecuado o firmamos cláusulas contractuales tipo.</p>
            </div>
          </section>

          {/* 7. Cookies y Tecnologías Similares */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">7</span>
              Cookies y Tecnologías Similares
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>7.1.</strong> Utilizamos cookies propias y de terceros para:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Mantener tu sesión iniciada (cookies funcionales).</li>
                <li>Analizar el uso de la Plataforma y mejorar su rendimiento (cookies analíticas).</li>
                <li>Recordar tus preferencias (idioma, configuración de privacidad).</li>
              </ul>
              <p><strong>7.2.</strong> Puedes gestionar o deshabilitar las cookies desde la configuración de tu navegador, pero algunas funcionalidades podrían verse afectadas.</p>
              <p><strong>7.3.</strong> No utilizamos cookies para fines publicitarios sin tu consentimiento expreso.</p>
            </div>
          </section>

          {/* 8. Seguridad de los Datos */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">8</span>
              Seguridad de los Datos
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>8.1.</strong> Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida, alteración o destrucción, incluyendo:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cifrado de datos en tránsito (TLS/SSL) y en reposo.</li>
                <li>Almacenamiento de contraseñas mediante hash con sal (bcrypt).</li>
                <li>Control de accesos a los sistemas y formación del personal.</li>
                <li>Monitoreo continuo de vulnerabilidades y auditorías de seguridad.</li>
              </ul>
              <p><strong>8.2.</strong> A pesar de estos esfuerzos, ningún sistema es 100% seguro; por ello, te recomendamos mantener tu contraseña confidencial y notificar cualquier actividad sospechosa.</p>
            </div>
          </section>

          {/* 9. Derechos de los Usuarios */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">9</span>
              Derechos de los Usuarios (ARCO +)
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p>De acuerdo con la Ley 172-13, tienes los siguientes derechos, que puedes ejercer enviando una solicitud a <a href="mailto:toseigusoku@gmail.com" className="text-blue-600 hover:underline">toseigusoku@gmail.com</a>:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Acceso:</strong> Conocer qué datos personales tenemos sobre ti.</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos (salvo que debamos conservarlos por ley).</li>
                <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos para fines promocionales o de análisis.</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y transmitirlos a otro responsable.</li>
                <li><strong>Revocación del consentimiento:</strong> En cualquier momento, sin que afecte a la licitud del tratamiento previo.</li>
              </ul>
              <p><strong>9.1.</strong> Atenderemos tu solicitud en un plazo máximo de <strong>15 días hábiles</strong> desde su recepción, pudiendo extenderse por 15 días adicionales si el caso es complejo.</p>
              <p><strong>9.2.</strong> En caso de que no estés satisfecho con nuestra respuesta, puedes acudir al <strong>Instituto Dominicano de Protección de Datos (INDEPD)</strong>.</p>
            </div>
          </section>

          {/* 10. Enlaces a Terceros */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">10</span>
              Enlaces a Sitios de Terceros
            </h2>
            <p className="text-sm sm:text-base pl-2">
              Nuestra Plataforma puede contener enlaces a sitios externos (ej. redes sociales, pasarelas de pago). 
              No somos responsables de las políticas de privacidad ni del contenido de dichos sitios; te recomendamos 
              leer sus políticas antes de proporcionarles tus datos.
            </p>
          </section>

          {/* 11. Cambios en la Política de Privacidad */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">11</span>
              Cambios en esta Política
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>11.1.</strong> Podemos actualizar esta política periódicamente para reflejar cambios en nuestras prácticas o en la legislación.</p>
              <p><strong>11.2.</strong> Te notificaremos con al menos <strong>10 días de antelación</strong> mediante un aviso en la Plataforma o por correo electrónico, si el cambio es relevante.</p>
              <p><strong>11.3.</strong> La fecha de la última revisión aparece al inicio de este documento. Te recomendamos revisar esta política cada cierto tiempo.</p>
            </div>
          </section>

          {/* 12. Contacto */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">12</span>
              Contacto para Ejercer tus Derechos
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p>Para cualquier consulta, solicitud de ejercicio de derechos o reporte de incidentes de seguridad, puedes contactarnos a través de:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Correo electrónico:</strong> <a href="mailto:toseigusoku@gmail.com" className="text-blue-600 hover:underline">toseigusoku@gmail.com</a></li>
                <li><strong>WhatsApp:</strong> <a href="https://wa.me/18296378733" className="text-blue-600 hover:underline">829-637-8733</a></li>
                <li><strong>Dirección física:</strong> (consulta en nuestra web o en la escuela).</li>
              </ul>
              <p>Te responderemos en el menor tiempo posible y siempre dentro del plazo legal.</p>
            </div>
          </section>

          {/* Aceptación y consentimiento */}
          <div className="border-t border-gray-200 pt-6 mt-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
            <p className="font-semibold">Al registrarte y usar nuestra Plataforma, declaras que has leído, entendido y aceptado esta Política de Privacidad.</p>
            <p className="mt-1">Si eres representante legal de un menor, aceptas en su nombre y te comprometes a supervisar su uso de la Plataforma.</p>
          </div>

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
