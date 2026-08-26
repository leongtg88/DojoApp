// app/terminos/page.jsx (o pages/terminos.js en Pages Router)
export default function TerminosLegales() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-red-700 px-6 py-8 sm:px-10">
          <h1 className="text-3xl font-bold text-white text-center sm:text-4xl">
            Términos y Condiciones Generales
          </h1>
          <p className="text-center text-red-100 mt-2 text-sm sm:text-base">
            TOSEI GUSOKU DOJO CLUB · Shitoryu Karate Do
          </p>
          <p className="text-center text-red-200 text-xs mt-1">
            Versión 2026-v2 · Sustituye versiones anteriores para nuevas inscripciones
          </p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 text-gray-800 space-y-8">

          {/* Introducción */}
          <div className="text-sm text-gray-600 border-b border-gray-200 pb-4">
            <p className="font-semibold">Aplica a todas las sucursales y escuelas afiliadas a TOSEI GUSOKU DOJO CLUB.</p>
            <p className="mt-1">Al inscribirte, aceptas todas las condiciones aquí descritas.</p>
          </div>

          {/* Artículo 1 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              Protección de Datos Personales
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>1.1.</strong> TOSEI GUSOKU DOJO CLUB recopila datos personales y, en su caso, datos sensibles de salud del estudiante (o de su representado) con la única finalidad de gestionar la inscripción, dar seguimiento al programa de enseñanza, tramitar el carnet federativo y mantener la comunicación operativa de la escuela (horarios, pagos, avisos).</p>
              <p><strong>1.2.</strong> Los documentos de identidad, fotografías y datos de salud se conservarán mientras el estudiante mantenga membresía activa y hasta veinticuatro (24) meses después de su baja, salvo que una disposición legal exija un plazo distinto o exista un procedimiento en curso que requiera su conservación.</p>
              <p><strong>1.3.</strong> El estudiante, padre, madre o representante puede solicitar en cualquier momento, por los canales de contacto registrados por la escuela, la rectificación o eliminación de sus datos personales, salvo aquellos que deban conservarse por obligación legal o para la defensa de derechos de TOSEI GUSOKU DOJO CLUB.</p>
              <p><strong>1.4.</strong> Los datos no serán vendidos ni cedidos a terceros con fines comerciales. Podrán compartirse únicamente con la Federación Dominicana de Karate para efectos del carnet federativo, y con procesadores de pago para la gestión de cobros, en ambos casos limitado a lo estrictamente necesario.</p>
            </div>
          </section>

          {/* Artículo 2 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
              Condiciones para Ingresar y Permanecer en el Dojo
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>2.1.</strong> El estudiante, padre o representante declara haber leído en su totalidad, entendido y aceptado las condiciones de la escuela, así como el compromiso de darle o darse seguimiento y motivar el entrenamiento adicional al recibido en la escuela, como parte del desarrollo de la autodisciplina propia de la práctica de artes marciales.</p>
              <p><strong>2.2.</strong> Al ingresar a la escuela se debe reverenciar al Shomen (imágenes de los maestros de la escuela) y al Sensei o instructor correspondiente.</p>
              <p><strong>2.3.</strong> No se permite el uso de gorras dentro de la escuela.</p>
              <p><strong>2.4.</strong> El karategui y el calzado para ingresar a la escuela deben mantenerse limpios.</p>
              <p><strong>2.5.</strong> Se agradece mantener silencio dentro de la escuela; en caso de usar sillas o muebles, sentarse de forma adecuada.</p>
              <p><strong>2.6.</strong> No se permite ingresar al tatami con calzado.</p>
              <p><strong>2.7.</strong> El padre o representante debe abstenerse de ingresar al pasillo de los vestidores, salvo que necesite hacerlo o pasar al baño.</p>
              <p><strong>2.8.</strong> Cada alumno se compromete moralmente a no utilizar jamás una técnica de Karate Do para hacer daño a otros o para exteriorizar su ego, salvo en una situación de vida o muerte, o donde se atente contra la integridad moral y el honor del practicante o de una persona vulnerable. El Karate Do es una herramienta que conduce al desarrollo de una sociedad mejor a través del desarrollo del carácter del individuo.</p>
              <p><strong>2.9.</strong> Los alumnos deben usar chancletas, sandalias o crocs para salir de los vestidores e ingresar al tatami, y llevar a sus clases una toalla pequeña para el sudor.</p>
              <p><strong>2.10.</strong> Cada alumno tiene distintas capacidades físicas y razones para practicar artes marciales; todas merecen respeto. Es responsabilidad de cada practicante no ocasionar daño alguno, protegiendo al compañero y a sí mismo.</p>
              <p><strong>2.11.</strong> Se debe conservar en todo momento buena educación, comunicación y respeto frente a quienes se encuentren en la escuela. Los maestros se reservan el derecho de admisión y de expulsión temporal o indefinida de cualquier persona, sin reembolso.</p>
            </div>
          </section>

          {/* Artículo 3 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
              Condiciones para Tomar Clase
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>3.1.</strong> El alumno debe encontrarse al día con la mensualidad; de lo contrario, no podrá ingresar al tatami.</p>
              <p><strong>3.2.</strong> Se debe llenar el formulario de inscripción, cargar foto tipo carnet con fondo blanco, partida de nacimiento (en caso de niños) o cédula de identidad (en caso de adultos), y realizar el pago correspondiente al trámite.</p>
              <p><strong>3.3.</strong> A partir del tercer mes de práctica es obligatoria la adquisición de protecciones para manos y pies con el sello de la organización.</p>
              <p><strong>3.4.</strong> En caso de tomar una clase de prueba, el interesado debe notificar previamente el día, la hora y la sucursal a la que desea asistir. La inasistencia a una clase de prueba comprometida, sin aviso ni motivo justificado, puede implicar la pérdida de los descuentos promocionales vigentes en ese momento. Se debe asistir con ropa deportiva y sudadera, evitando cierres o costuras ásperas; no se permite el uso de shorts.</p>
              <p><strong>3.5.</strong> Los padres o representantes no deben comunicarse con el niño mientras se encuentra dentro del tatami. Si un alumno, por su edad, temperamento o condición, no puede mantener el orden, control o respeto dentro de la clase, el padre, madre o representante acepta y permite que el Sensei tome las medidas disciplinarias que correspondan, sin intromisión de terceros, salvo que el propio Sensei la requiera.</p>
              <p><strong>3.6.</strong> En caso de inasistencia, el alumno puede reponer la clase siempre que la ausencia haya sido notificada por WhatsApp. El número de reposiciones acumulables, su plazo de vigencia y el procedimiento para solicitarlas serán los que la escuela defina en su política interna de reposición de clases, la cual forma parte integral de este documento y estará disponible para consulta de los alumnos. Si el practicante faltare a doce (12) clases por cuatrimestre, pierde automáticamente el derecho a examen de grado.</p>
              <p><strong>3.7.</strong> En caso de enfermedad (resfriado común, problemas estomacales) o lesión que pueda agravarse, se debe evitar tomar clase hasta la mejoría.</p>
              <p><strong>3.8.</strong> Se debe mantener silencio y concentración durante la clase, así como entrenar diligentemente.</p>
            </div>
          </section>

          {/* Artículo 4 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
              Descargo de Responsabilidad y Uso de Imagen
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>4.1.</strong> Quien suscribe declara haberse inscrito e incorporado de forma libre y voluntaria al curso de Defensa Personal / Karate Do impartido por TOSEI GUSOKU DOJO CLUB, y manifiesta lo siguiente.</p>
              <p><strong>4.2.</strong> Declara encontrarse en condiciones físicas y de salud adecuadas para tomar el curso. No obstante, admite y reconoce que la práctica de artes marciales conlleva el riesgo de sufrir lesiones físicas menores, lesiones graves o, en casos extremos, la muerte. Por tanto, asume los riesgos ordinarios e inherentes a la actividad y será responsable, por su propia cuenta, de los gastos derivados de tratamientos médicos o terapias que resulten de dichos riesgos.</p>
              <p><strong>4.3.</strong> Libera y exime de responsabilidad civil a TOSEI GUSOKU DOJO CLUB, al Sensei León Trujillo, a los instructores, al personal y a los voluntarios del Dojo, por cualquier incidente o accidente ocurrido durante la práctica ordinaria de Karate Do, en los términos de este artículo. Lo anterior aplica igualmente a los herederos y causahabientes de quien suscribe, quien renuncia a reclamos derivados de lesión, enfermedad, gastos médicos o pérdida de objetos personales relacionados con la práctica ordinaria de la actividad.</p>
              <p><strong>4.4.</strong> Cuando el estudiante sea menor de edad, el padre, madre o representante legal firma este artículo en su propio nombre, asumiendo las obligaciones de supervisión y económicas aquí descritas.</p>
              <p><strong>4.5.</strong> Autoriza a TOSEI GUSOKU DOJO CLUB a realizar entrevistas, videos y fotografías del estudiante o su representado en cualquier actividad realizada por la escuela o en actividades relacionadas en las que participe como colaborador.</p>
              <p><strong>4.6.</strong> Otorga permiso a TOSEI GUSOKU DOJO CLUB para publicar, reproducir y exhibir dichas fotografías o videos en cualquier soporte conocido o por conocer (papel, digital, magnético, textil, plástico, etc.), integrados o no a otro material, con fines periodísticos, educativos, publicitarios o de diseño.</p>
              <p><strong>4.7.</strong> Reconoce el derecho de TOSEI GUSOKU DOJO CLUB a editar dichas fotografías o videos conforme a su criterio, y acepta que la escuela puede optar por no utilizarlas en el presente sin que ello descarte su uso futuro.</p>
              <p><strong>4.8.</strong> Renuncia a solicitar compensación por la participación en fotografías o videos producidos por la escuela, y reconoce que no existe contrato de exclusividad sobre el uso de su imagen o la de su representado con TOSEI GUSOKU DOJO CLUB.</p>
              <p><strong>4.9.</strong> TOSEI GUSOKU DOJO CLUB se compromete a no hacer uso de las fotografías o videos de manera que puedan afectar la vida privada del estudiante o su representado, ni con fines violentos o ilícitos.</p>
              <p><strong>4.10.</strong> El estudiante, padre, madre o representante puede solicitar en cualquier momento, por los canales de contacto registrados por la escuela, el retiro de una fotografía o video específico ya publicado por TOSEI GUSOKU DOJO CLUB. La solicitud se atenderá en un plazo razonable, sin perjuicio de reproducciones ya realizadas por terceros fuera del control directo de la escuela.</p>
            </div>
          </section>

          {/* Artículo 5 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">5</span>
              Condiciones de Pago y Membresía
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>5.1.</strong> La mensualidad debe pagarse por adelantado, mes por mes.</p>
              <p><strong>5.2.</strong> El pago de la mensualidad otorga al alumno el derecho a adquirir y mantener vigente la Membresía TOSEI GUSOKU, que incluye:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm sm:text-base">
                <li>Entrenamiento de Karate Do con maestros certificados bajo el estilo Inoue Ha Internacional.</li>
                <li>Uso de tatami especial para caídas.</li>
                <li>Orientación gratuita sobre la materia practicada, fuera del horario de entrenamiento.</li>
                <li>Programas de entrenamiento individual para quienes deseen profundizar en la práctica.</li>
                <li>Derecho de ingreso a la Escuela de Enseñanza de Aikido y pertenencia a TOSEI GUSOKU DOJO CLUB KARATE DO.</li>
                <li>Reposición de clase en otro horario, previa notificación vía WhatsApp con al menos 24 horas de anticipación.</li>
                <li>El Dojo se reserva el derecho de admisión de cualquier inscrito.</li>
              </ul>
              <p><strong>5.3.</strong> La vigencia de la membresía inicia con el primer pago de inscripción y/o mensualidad, y se mantiene por tiempo indeterminado y de forma ininterrumpida, debiendo pagarse mensualmente hasta que el alumno comunique su retiro de la escuela por cualquier vía, lo que implica el cese de la práctica de Karate Do en TOSEI GUSOKU DOJO CLUB.</p>
              <p><strong>5.4.</strong> El pago de la mensualidad da derecho a pertenecer a la escuela y debe realizarse de forma completa durante todo el año —salvo la excepción del artículo 5.5— independientemente de la asistencia efectiva a clases, incluso en los casos en que el alumno se incorpore en el transcurso del mes.</p>
              <p><strong>5.5.</strong> Se exceptúa el pago completo durante los meses de julio y agosto, por motivo de vacaciones escolares, para quienes no tomarán clases en dichos meses. El practicante puede optar por pagar una cuota de mantenimiento de RD$1,500.00 (alumnos de 2 días por semana) o RD$1,250.00 (alumnos de 1 día por semana).</p>
              <p><strong>5.6.</strong> La forma de pago es vía transferencia a la cuenta corriente especificada en este documento, enviando el comprobante de pago por WhatsApp.</p>
              <p><strong>5.7.</strong> La falta de pago por un mes completo puede conllevar la suspensión del alumno y la finalización de la membresía.</p>
              <p><strong>5.8.</strong> En caso de cancelación de la membresía, o de falta de pago de la mensualidad por más de un mes, el alumno pierde automáticamente el derecho a reincorporarse como alumno recurrente, así como los días de asistencia acumulados desde el nivel en que se encuentre, quedando sin efecto la vigencia de la membresía. La reincorporación posterior requiere el pago de una reinscripción de TRES MIL PESOS DOMINICANOS (RD$3,000.00) más un mes por adelantado.</p>
              <p><strong>5.9.</strong> La Escuela se reserva el derecho de cancelar o suspender a cualquier alumno por falta de pago, incumplimiento de las normas del Dojo, o cualquier otra razón que determine la Dirección, sin reembolso.</p>
              <p><strong>5.10.</strong> TOSEI GUSOKU DOJO CLUB puede aceptar el pago parcial de la mensualidad en caso de emergencia, mediante una cuota de mantenimiento o reserva de membresía de MIL DOSCIENTOS CINCUENTA PESOS DOMINICANOS (RD$1,250.00).</p>
              <p><strong>5.11.</strong> La mensualidad debe pagarse a más tardar el día 5 de cada mes. La escuela puede realizar hasta dos llamados de atención por falta de pago oportuno; a partir de entonces, cada mes en que el pago no se realice de forma oportuna genera un recargo de TRESCIENTOS CINCUENTA PESOS DOMINICANOS (RD$350.00) sobre la mensualidad del mes en curso. Si el pago se realiza después del día 15 del mes, se aplica un recargo adicional por el mismo monto. En ningún caso la suma de los recargos aplicados en un mismo mes podrá exceder el valor de una mensualidad regular. Las tarifas de mensualidad y recargo podrán ajustarse en el futuro y se informarán oportunamente por WhatsApp o cualquier otro medio escrito.</p>
              <p><strong>5.12.</strong> TOSEI GUSOKU DOJO CLUB podrá organizar o participar en eventos donde se requiera, además de la mensualidad, un pago adicional por derecho de participación u otro concepto aplicable, así como el pago de exámenes de grado.</p>
              <p><strong>5.13.</strong> Todo alumno, padre o representante del alumno inscrito recibirá, por cualquier medio, una copia de estas condiciones generales, en señal de haberlas comprendido y aceptado. Estas condiciones aplican a todas las escuelas afiliadas a TOSEI GUSOKU DOJO CLUB.</p>
            </div>
          </section>

          {/* Artículo 6 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">6</span>
              Resolución de Desacuerdos y Jurisdicción
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>6.1.</strong> Ante cualquier desacuerdo relacionado con este documento, las partes procurarán resolverlo primero de buena fe y mediante diálogo directo entre el padre, madre o representante y la Dirección de la escuela.</p>
              <p><strong>6.2.</strong> De no llegar a un acuerdo, cualquier disputa relacionada con este contrato quedará sometida a los tribunales competentes de la ciudad y jurisdicción donde esté domiciliada la sucursal correspondiente de TOSEI GUSOKU DOJO CLUB, en la República Dominicana.</p>
            </div>
          </section>

          {/* Artículo 7 */}
          <section>
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 w-7 h-7 rounded-full flex items-center justify-center text-sm">7</span>
              Inscripción y Datos de Contacto
            </h2>
            <div className="space-y-2 text-sm sm:text-base pl-2">
              <p><strong>7.1.</strong> Para formalizar la inscripción se debe realizar el pago del monto correspondiente a la cuenta suministrada por la escuela.</p>
              <p><strong>7.2.</strong> Enviar el comprobante de pago al WhatsApp <a href="https://wa.me/18296378733" className="text-red-600 hover:underline">829-637-8733</a>.</p>
              <p><strong>7.3.</strong> Contacto: <a href="mailto:toseigusoku@gmail.com" className="text-red-600 hover:underline">toseigusoku@gmail.com</a> · <a href="https://www.toseigusoku.com" className="text-red-600 hover:underline">www.toseigusoku.com</a></p>
            </div>
          </section>

          {/* Pie de página */}
          <div className="border-t border-gray-200 pt-6 mt-8 text-xs text-gray-500 text-center">
            <p>© {new Date().getFullYear()} TOSEI GUSOKU DOJO CLUB · Todos los derechos reservados.</p>
            <p className="mt-1">Versión 2026-v2 · Este documento es parte integral del contrato de inscripción.</p>
          </div>

        </div>
      </div>
    </div>
  );
}