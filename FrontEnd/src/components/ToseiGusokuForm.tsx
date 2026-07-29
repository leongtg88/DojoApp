import React, { useState } from 'react';

interface ToseiGusokuFormProps {
  onNavigateToHome: () => void;
}

type FormData = {
  nombreAlumno: string;
  fechaNacimiento: string;
  nombre2doAlumno: string;
  fechaNacimiento2do: string;
  nombreMadre: string;
  telefonoMadre: string;
  nombrePadre: string;
  telefonoPadre: string;
  email: string;
  telefonoContacto: string;
  condicionMedica: string;
  horasPractica: string;
  espacioCasa: string;
  compromisoDiario: string;
  asistenciaPadre: string;
  metodoMotivacion: string[];
  otroMetodoMotivacion: string;
  razonesKarate: string[];
  otraRazon: string;
  compromisoObstaculos: string;
  otroCompromiso: string;
  aceptoPago: boolean;
  aceptoMultas: boolean;
  aceptoPagosParciales: boolean;
  aceptoPagoIninterrumpido: boolean;
  aceptoDerechoAdmision: boolean;
  aceptoPoliticas: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const ToseiGusokuForm = ({ onNavigateToHome }: ToseiGusokuFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nombreAlumno: '',
    fechaNacimiento: '',
    nombre2doAlumno: '',
    fechaNacimiento2do: '',
    nombreMadre: '',
    telefonoMadre: '',
    nombrePadre: '',
    telefonoPadre: '',
    email: '',
    telefonoContacto: '',
    condicionMedica: '',
    horasPractica: '',
    espacioCasa: '',
    compromisoDiario: '',
    asistenciaPadre: '',
    metodoMotivacion: [],
    otroMetodoMotivacion: '',
    razonesKarate: [],
    otraRazon: '',
    compromisoObstaculos: '',
    otroCompromiso: '',
    aceptoPago: false,
    aceptoMultas: false,
    aceptoPagosParciales: false,
    aceptoPagoIninterrumpido: false,
    aceptoDerechoAdmision: false,
    aceptoPoliticas: false
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMultiSelect = (name: 'metodoMotivacion' | 'razonesKarate', value: string) => {
    setFormData(prev => {
      const current = prev[name];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [name]: [...current, value] };
      }
    });
  };

  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    if (!formData.nombreAlumno.trim()) newErrors.nombreAlumno = 'Campo requerido';
    if (!formData.fechaNacimiento) newErrors.fechaNacimiento = 'Campo requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'Campo requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: FormErrors = {};
    if (!formData.horasPractica) newErrors.horasPractica = 'Selecciona una opción';
    if (!formData.espacioCasa) newErrors.espacioCasa = 'Selecciona una opción';
    if (!formData.compromisoDiario) newErrors.compromisoDiario = 'Selecciona una opción';
    if (formData.razonesKarate.length === 0) newErrors.razonesKarate = 'Selecciona al menos una opción';
    if (!formData.compromisoObstaculos) newErrors.compromisoObstaculos = 'Selecciona una opción';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: FormErrors = {};
    const camposAceptacion: (keyof FormData)[] = [
      'aceptoPago', 'aceptoMultas', 'aceptoPagosParciales',
      'aceptoPagoIninterrumpido', 'aceptoDerechoAdmision', 'aceptoPoliticas'
    ];
    camposAceptacion.forEach(campo => {
      if (!formData[campo]) newErrors[campo] = 'Debes aceptar para continuar';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateStep3()) {
      // Construir datos para Google Forms
      const googleFormData = new FormData();
      googleFormData.append('entry.1234567890', formData.nombreAlumno); // Reemplazar con IDs reales
      googleFormData.append('entry.0987654321', formData.fechaNacimiento);
      // ... añadir todos los campos con sus entry IDs correspondientes
      
      // Enviar a Google Forms
      fetch('https://docs.google.com/forms/d/e/1FAIpQLSdwc5V7oPXVLfloRrqt4TZ1aWKtGzZ595OzxQPexSJHvE0UUQ/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        body: googleFormData
      }).then(() => {
        alert('Formulario enviado correctamente');
        // Resetear formulario o redirigir
      }).catch(error => {
        console.error('Error:', error);
        alert('Error al enviar el formulario');
      });
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2">
            Formulario de Inscripcíon
          </h1>
          
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Barra de progreso */}
          <div className="bg-gray-700 text-white p-6">
            <p className="text-sm text-stone-300 mb-2">
              Muchas gracias por contactarnos, por favor llenar los campos requeridos para completar el proceso de inscripción.
            </p>
            <div className="flex items-center justify-between mt-4">
              {['Datos Personales', 'Compromiso', 'Políticas'].map((label, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > index + 1 ? 'bg-green-500 text-white' : 
                    step === index + 1 ? 'bg-brand-accent text-white' : 'bg-stone-600 text-stone-300'
                  }`}>
                    {step > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    step === index + 1 ? 'text-white' : 'text-stone-400'
                  }`}>{label}</span>
                  {index < 2 && <div className="w-12 sm:w-24 h-0.5 mx-2 bg-stone-600"></div>}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {/* PASO 1: Datos Personales */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-stone-800 border-b pb-3">Datos del Alumno</h3>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Nombre y Apellido del Alumno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombreAlumno"
                    value={formData.nombreAlumno}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${
                      errors.nombreAlumno ? 'border-red-500' : 'border-stone-300'
                    }`}
                    placeholder="Nombre completo del alumno"
                  />
                  {errors.nombreAlumno && <p className="text-red-500 text-xs mt-1">{errors.nombreAlumno}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${
                      errors.fechaNacimiento ? 'border-red-500' : 'border-stone-300'
                    }`}
                  />
                  {errors.fechaNacimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaNacimiento}</p>}
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-stone-700 mb-4">Segundo Alumno (opcional)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Nombre y Apellido del 2do Alumno
                      </label>
                      <input
                        type="text"
                        name="nombre2doAlumno"
                        value={formData.nombre2doAlumno}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Fecha de Nacimiento de 2do Alumno
                      </label>
                      <input
                        type="date"
                        name="fechaNacimiento2do"
                        value={formData.fechaNacimiento2do}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-stone-700 mb-4">Datos de los Padres (solo para menores)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Nombre y Apellido de la Madre
                      </label>
                      <input
                        type="text"
                        name="nombreMadre"
                        value={formData.nombreMadre}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Teléfono de la Madre
                      </label>
                      <input
                        type="tel"
                        name="telefonoMadre"
                        value={formData.telefonoMadre}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Nombre y Apellido del Padre
                      </label>
                      <input
                        type="text"
                        name="nombrePadre"
                        value={formData.nombrePadre}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Teléfono del Padre
                      </label>
                      <input
                        type="tel"
                        name="telefonoPadre"
                        value={formData.telefonoPadre}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Email a donde recibirá Info., recibos, facturas etc. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${
                      errors.email ? 'border-red-500' : 'border-stone-300'
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Teléfono de Contacto (En caso de ser mayor de edad)
                  </label>
                  <input
                    type="tel"
                    name="telefonoContacto"
                    value={formData.telefonoContacto}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    ¿El/Los alumno/s posee/n alguna condición médica de salud física o mental que desee que tomemos en cuenta?
                  </label>
                  <textarea
                    name="condicionMedica"
                    value={formData.condicionMedica}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                    placeholder="Describa cualquier condición médica relevante..."
                  />
                </div>
              </div>
            )}

            {/* PASO 2: Compromiso y Práctica */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-stone-800 border-b pb-3">Compromiso y Práctica</h3>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ¿Cuántas horas a la semana puedes dedicar al entrenamiento y práctica del karate fuera del horario de clases? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {['Menos de 1 hora', '1-2 horas', '3-5 horas', 'Más de 5 horas'].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="horasPractica"
                          value={opcion}
                          checked={formData.horasPractica === opcion}
                          onChange={handleChange}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {errors.horasPractica && <p className="text-red-500 text-xs mt-1">{errors.horasPractica}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ¿Tienes un espacio en casa adecuado para practicar los movimientos y katas del karate? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    {['Si', 'No'].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="espacioCasa"
                          value={opcion}
                          checked={formData.espacioCasa === opcion}
                          onChange={handleChange}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {formData.espacioCasa === 'Otro' && (
                    <input
                      type="text"
                      placeholder="Especificar..."
                      className="mt-2 w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                    />
                  )}
                  {errors.espacioCasa && <p className="text-red-500 text-xs mt-1">{errors.espacioCasa}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ¿Estás dispuesto(a) a comprometerte a practicar al menos 10-15 minutos al día fuera de las clases? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    {['Si', 'No'].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="compromisoDiario"
                          value={opcion}
                          checked={formData.compromisoDiario === opcion}
                          onChange={handleChange}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {errors.compromisoDiario && <p className="text-red-500 text-xs mt-1">{errors.compromisoDiario}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Como padre/madre/tutor, ¿puedes asistir periódicamente a las clases o a los eventos para motivar a tu hijo(a)?
                  </label>
                  <div className="space-y-2">
                    {[
                      'Sí, puedo asistir frecuentemente',
                      'Solo en algunas ocasiones',
                      'Me resulta difícil asistir'
                    ].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="asistenciaPadre"
                          value={opcion}
                          checked={formData.asistenciaPadre === opcion}
                          onChange={handleChange}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ¿Cómo planeas motivarte o a tu hijo(a) para que practique en casa? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      'Ayudándolo a organizar un horario de práctica',
                      'Practicando con él/ella',
                      'Premiándolo de alguna forma por su esfuerzo',
                      'Hablando con él/ella sobre la importancia del compromiso',
                      'Otras'
                    ].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={formData.metodoMotivacion.includes(opcion)}
                          onChange={() => handleMultiSelect('metodoMotivacion', opcion)}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {formData.metodoMotivacion.includes('Otras') && (
                    <input
                      type="text"
                      name="otroMetodoMotivacion"
                      value={formData.otroMetodoMotivacion}
                      onChange={handleChange}
                      placeholder="Especificar otro método..."
                      className="mt-2 w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ¿Por qué deseas que tú (o tu hijo/a) practique karate? (Selecciona todas las que apliquen) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      'Mejorar la disciplina',
                      'Aprender defensa personal',
                      'Desarrollar confianza y autoestima',
                      'Mejorar la condición física'
                    ].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={formData.razonesKarate.includes(opcion)}
                          onChange={() => handleMultiSelect('razonesKarate', opcion)}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {errors.razonesKarate && <p className="text-red-500 text-xs mt-1">{errors.razonesKarate}</p>}
                  <input
                    type="text"
                    name="otraRazon"
                    value={formData.otraRazon}
                    onChange={handleChange}
                    placeholder="Otra razón..."
                    className="mt-2 w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ¿Estás comprometido(a) a continuar con el entrenamiento incluso cuando surjan obstáculos como el cansancio, la falta de tiempo o la desmotivación? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      'Sí, entiendo que el progreso requiere constancia',
                      'Dependerá de las circunstancias',
                      'No estoy seguro'
                    ].map(opcion => (
                      <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="compromisoObstaculos"
                          value={opcion}
                          checked={formData.compromisoObstaculos === opcion}
                          onChange={handleChange}
                          className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-stone-700">{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {errors.compromisoObstaculos && <p className="text-red-500 text-xs mt-1">{errors.compromisoObstaculos}</p>}
                </div>
              </div>
            )}

            {/* PASO 3: Políticas de la Escuela */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                  <p className="text-stone-700 text-sm">
                    A continuación le presentaremos un resumen de algunas de las reglas relevantes contenidas en las políticas de la escuela suministradas vía WhatsApp. En el caso de no aceptar alguna de ellas, ponerse en contacto con el Sensei Encargado para aclarar cualquier inquietud, de lo contrario no podrá ser admitido en la escuela.
                  </p>
                  <p className="text-stone-600 text-sm mt-2 italic">
                    El karate Do es un estudio de por vida, por lo que entendemos que debe existir buena comunicación entre los alumnos y los maestros.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'aceptoPago', label: 'ACEPTO pagar los primeros 5 días de cada mes.' },
                    { name: 'aceptoMultas', label: 'ACEPTO la política sobre multas por retraso en las cuotas.' },
                    { name: 'aceptoPagosParciales', label: 'ACEPTO que no hay pagos parciales exceptuando los casos establecidos en las políticas sobre emergencias y verano.' },
                    { name: 'aceptoPagoIninterrumpido', label: 'ACEPTO realizar el pago mensual e ininterrumpido durante todo el año.' },
                    { name: 'aceptoDerechoAdmision', label: 'ACEPTO que la escuela se reserva el derecho de admisión.' },
                    { name: 'aceptoPoliticas', label: 'ACEPTO las políticas de Descargo de Responsabilidad y Uso de imagen.' }
                  ].map(({ name, label }) => (
                    <div key={name} className={`p-4 border rounded-lg transition ${
                      formData[name as keyof FormData] ? 'border-green-300 bg-green-50' : 
                      errors[name as keyof FormData] ? 'border-red-300 bg-red-50' : 'border-stone-200'
                    }`}>
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          name={name}
                          checked={!!formData[name as keyof FormData]}
                          onChange={handleChange}
                          className="mt-1 mr-3 h-5 w-5 text-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="text-stone-700 font-medium">{label}</span>
                      </label>
                      {errors[name as keyof FormData] && <p className="text-red-500 text-xs mt-2 ml-8">{errors[name as keyof FormData]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition font-medium"
                >
                  ← Anterior
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToHome}
                  className="px-6 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition font-medium"
                >
                  ← Volver al Inicio
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Enviar Inscripción
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-stone-500 text-sm mt-6">
          * Indica que la pregunta es obligatoria
        </p>
      </div>
    </div>
  );
};

export default ToseiGusokuForm;