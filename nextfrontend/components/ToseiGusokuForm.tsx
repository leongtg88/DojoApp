'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_BENEFITS } from '@/lib/types';
import { Award, BrainCircuit, Flame, ShieldAlert, HeartHandshake, FileText, ChevronDown } from 'lucide-react';

const heroImageDesktop = '/assets/BannerbgHero19080x1080.webp';
const LogoCuadradoBlanco = '/assets/LogoCuadradoBlanco.svg';

// ========== TIPOS ==========
type Hijo = {
  id: string;
  nombre: string;
  fechaNacimiento: string;
  tipoSangre: string;
  foto: File | null;
  identificacion: File[];
  fotoPreview: string;
  identPreview: string[];
};

type FormData = {
  tipoRegistro: 'adulto' | 'menor';
  // Adulto
  nombreAdulto: string;
  fechaNacimientoAdulto: string;
  tipoSangreAdulto: string;
  direccionAdulto: string;
  cedula: string;
  fotoAdulto: File | null;
  identAdulto: File[];
  fotoAdultoPreview: string;
  identAdultoPreview: string[];
  telefonoContacto: string;
  email: string;
  // Menor
  hijos: Hijo[];
  nombreMadre: string;
  telefonoMadre: string;
  nombrePadre: string;
  telefonoPadre: string;
  direccionPadres: string;
  // Comunes (paso 2)
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
  // Políticas
  aceptoPago: boolean;
  aceptoMultas: boolean;
  aceptoPagosParciales: boolean;
  aceptoPagoIninterrumpido: boolean;
  aceptoDerechoAdmision: boolean;
  aceptoPoliticas: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>> & {
  hijos?: Array<Record<string, string>>;
};

// ========== HELPERS ==========
const getBenefitIcon = (iconName: string) => {
  switch (iconName) {
    case 'BrainCircuit': return <BrainCircuit className="w-8 h-8" />;
    case 'Flame': return <Flame className="w-8 h-8" />;
    case 'ShieldAlert': return <ShieldAlert className="w-8 h-8" />;
    case 'HeartHandshake': return <HeartHandshake className="w-8 h-8" />;
    default: return <BrainCircuit className="w-8 h-8" />;
  }
};

const generarId = () => Math.random().toString(36).substr(2, 9);

const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ========== COMPONENTE DRAG & DROP ==========
const FileDropZone = ({ label, files, previews, error, accept, multiple, hint, onFiles, onRemove }: {
  label: string;
  files: File[];
  previews: string[];
  error?: string;
  accept?: string;
  multiple?: boolean;
  hint?: string;
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (dropped.length) onFiles(dropped);
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg p-4 cursor-pointer transition text-center ${dragging ? 'border-brand-accent bg-brand-accent/10' : error ? 'border-red-400 bg-red-50' : 'border-brand-accent/50 hover:border-brand-accent hover:bg-brand-accent/5'
          }`}
      >
        {files.length === 0 ? (
          <>
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
            </svg>
            <span className="text-xs text-stone-500">Arrastra aquí o <span className="text-brand-accent font-medium">selecciona archivo</span></span>
            {hint && <span className="text-[11px] text-stone-400">{hint}</span>}
          </>
        ) : (
          <div className="w-full space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 border border-stone-200 rounded p-2 bg-white text-left">
                {isImage(file) && previews[i] ? (
                  <img src={previews[i]} alt={file.name} className="w-10 h-10 object-cover rounded border shrink-0" />
                ) : (
                  <FileText className="w-6 h-6 text-brand-accent shrink-0" />
                )}
                <span className="text-xs text-stone-600 truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  className="text-red-500 hover:text-red-700 shrink-0 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
            <span className="text-[11px] text-brand-accent font-medium block">Agregar otro archivo</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          if (selected.length) onFiles(selected);
          e.target.value = '';
        }}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// ========== COMPONENTE WELCOME ==========
const WelcomeScreen = ({ onStart, onNavigateToHome }: { onStart: () => void; onNavigateToHome: () => void }) => (
  <div className="min-h-screen relative bg-fixed flex items-center justify-center px-4" style={{ backgroundImage: `url(${heroImageDesktop})`, backgroundSize: 'fixed', backgroundPosition: 'center' }}>
    <div className="absolute inset-x-0 top-0 -bottom-[2px] z-0 pointer-events-none bg-gradient-to-br from-stone-900/95 via-blue-950/50 to-blue-900 bg-opacity-80 backdrop-blur-md to-transparent" />
    <div className="max-w-7xl w-full text-center relative z-10 pt-8">
      {/* Logo y título */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full border-4 border-brand-accent/60 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-2 border-brand-accent/50"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center pt-12 pb-12">
          <div className="w-40 h-40 flex items-center justify-center hover:scale-105 transition-transform duration-300">
            <img src={LogoCuadradoBlanco} alt="Logo Tosei Gusoku" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Sección de Inscripción</h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-brand-accent">Bienvenido(a)</h2>
        <div className="w-24 h-1 bg-brand-accent mx-auto"></div>
      </div>
      {/* Beneficios */}
      <section className="max-w-7xl mx-auto px-8 md:px-[50px] space-y-6 md:space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full text-brand-accent text-xs font-bold font-display uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Estilo de Vida Marcial
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">Visualiza tu futuro</h2>
          <p className="text-sm text-center sm:text-base text-gray-300">Por qué entrenar en Escuela Tosei Gusoku va mucho más allá de aprender a golpear o patear.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_BENEFITS.map((benefit) => (
            <div key={benefit.id} className="p-6 bg-black/40 rounded-2xl flex flex-col space-y-4 glass-card-hover border border-white/5 relative overflow-hidden group shadow-md shadow-black/40 tracking-tight md:leading-5" style={{ animation: "border-color-change 8s infinite linear" }}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${benefit.colorClass}`}>
                {getBenefitIcon(benefit.iconName)}
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl font-display text-white group-hover:text-brand-accent transition-colors">{benefit.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed font-sans">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-black/40 border border-amber-700/50 rounded-xl p-6 mb-8 text-left" style={{ animation: "border-color-change 8s infinite linear" }}>
          <h4 className="text-amber-400 font-semibold mb-3 flex items-center">
            <span className="text-xl mr-2">📋</span> Antes de comenzar, ten en cuenta:
          </h4>
          <ul className="space-y-2 text-stone-300 text-sm">
            <li className="flex items-start"><span className="text-amber-400 mr-2">•</span>El formulario consta de 3 secciones y toma aproximadamente 10 minutos completarlo</li>
            <li className="flex items-start"><span className="text-amber-400 mr-2">•</span>Necesitarás tener a mano los datos personales del alumno y contacto de padres/tutores</li>
            <li className="flex items-start"><span className="text-amber-400 mr-2">•</span>Necesitarás cargar una foto de la cara del alumno con fondo blanco y su identificación (partida de nacimiento, cédula o pasaporte) en formato JPG, PNG o PDF.</li>
            <li className="flex items-start"><span className="text-amber-400 mr-2">•</span>En un mismo campo puedes subir la cédula y el pasaporte.</li>
            <li className="flex items-start"><span className="text-amber-400 mr-2">•</span>Al finalizar, deberás aceptar las políticas y reglamentos del Dojo</li>
            <li className="flex items-start"><span className="text-amber-400 mr-2">•</span>Los campos marcados con <span className="text-red-400 mx-1">*</span> son obligatorios</li>
          </ul>
        </div>
      </section>
      <div className="flex w-full items-center justify-between gap-4 py-6 md:px-[50px] md:pb-20">
        <button onClick={onNavigateToHome} className="text-xs text-white hover:text-stone-300 transition underline">← Volver al Inicio</button>
        <button onClick={onStart} className="group relative ml-auto inline-flex items-center justify-center px-10 py-4 overflow-hidden font-bold text-white rounded-full shadow-2xl bg-brand-accent from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-105 cursor-pointer">
          <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center text-lg">Comenzar Inscripción
            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  </div>
);

// ========== COMPONENTE PRINCIPAL ==========
const ToseiGusokuForm = () => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        titleRef.current?.focus();
      }, 50);
    }
  }, [showForm, step]);

  // ===== ESTADO INICIAL =====
  const createInitialFormData = (): FormData => ({
    tipoRegistro: 'menor',
    nombreAdulto: '',
    fechaNacimientoAdulto: '',
    tipoSangreAdulto: '',
    direccionAdulto: '',
    cedula: '',
    fotoAdulto: null,
    identAdulto: [],
    fotoAdultoPreview: '',
    identAdultoPreview: [],
    telefonoContacto: '',
    email: '',
    hijos: [{ id: generarId(), nombre: '', fechaNacimiento: '', tipoSangre: '', foto: null, identificacion: [], fotoPreview: '', identPreview: [] }],
    nombreMadre: '',
    telefonoMadre: '',
    nombrePadre: '',
    telefonoPadre: '',
    direccionPadres: '',
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
    aceptoPoliticas: false,
  });

  const [formData, setFormData] = useState<FormData>(createInitialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  // ===== MANEJADORES =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTipoRegistro = (tipo: 'adulto' | 'menor') => {
    setFormData(prev => ({
      ...prev,
      tipoRegistro: tipo,
      // Resetear campos no usados para evitar datos residuales
      ...(tipo === 'adulto' ? {
        hijos: [],
        nombreMadre: '',
        telefonoMadre: '',
        nombrePadre: '',
        telefonoPadre: '',
      } : {
        nombreAdulto: '',
        fechaNacimientoAdulto: '',
        tipoSangreAdulto: '',
        direccionAdulto: '',
        cedula: '',
        fotoAdulto: null,
        identAdulto: [],
        fotoAdultoPreview: '',
        identAdultoPreview: [],
        telefonoContacto: '',
      })
    }));
    setErrors({});
  };

  // Manejo de hijos
  const agregarHijo = () => {
    setFormData(prev => ({
      ...prev,
      hijos: [...prev.hijos, { id: generarId(), nombre: '', fechaNacimiento: '', tipoSangre: '', foto: null, identificacion: [], fotoPreview: '', identPreview: [] }]
    }));
  };

  const eliminarHijo = (id: string) => {
    if (formData.hijos.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.filter(h => h.id !== id)
    }));
  };

  const handleHijoChange = (id: string, field: keyof Hijo, value: Hijo[keyof Hijo]) => {
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.map(h => h.id === id ? { ...h, [field]: value } : h)
    }));
  };

  const handleHijoFoto = (id: string, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.map(h =>
        h.id === id ? { ...h, foto: file, fotoPreview: preview } : h
      )
    }));
  };

  const handleHijoFotoRemove = (id: string) => {
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.map(h => h.id === id ? { ...h, foto: null, fotoPreview: '' } : h)
    }));
  };

  const handleHijoIdentFiles = (id: string, files: File[]) => {
    if (!files.length) return;
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.map(h => {
        if (h.id !== id) return h;
        const previews = [...h.identPreview, ...files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '')];
        return { ...h, identificacion: [...h.identificacion, ...files], identPreview: previews };
      })
    }));
  };

  const handleHijoIdentRemove = (id: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.map(h => {
        if (h.id !== id) return h;
        const removed = h.identPreview[index];
        if (removed) URL.revokeObjectURL(removed);
        return {
          ...h,
          identificacion: h.identificacion.filter((_, i) => i !== index),
          identPreview: h.identPreview.filter((_, i) => i !== index),
        };
      })
    }));
  };

  // Archivos para adulto
  const handleAdultoFoto = (file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      fotoAdulto: file,
      fotoAdultoPreview: preview,
    }));
  };

  const handleAdultoFotoRemove = () => {
    setFormData(prev => ({ ...prev, fotoAdulto: null, fotoAdultoPreview: '' }));
  };

  const handleAdultoIdentFiles = (files: File[]) => {
    if (!files.length) return;
    setFormData(prev => ({
      ...prev,
      identAdulto: [...prev.identAdulto, ...files],
      identAdultoPreview: [...prev.identAdultoPreview, ...files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '')],
    }));
  };

  const handleAdultoIdentRemove = (index: number) => {
    setFormData(prev => {
      const removed = prev.identAdultoPreview[index];
      if (removed) URL.revokeObjectURL(removed);
      return {
        ...prev,
        identAdulto: prev.identAdulto.filter((_, i) => i !== index),
        identAdultoPreview: prev.identAdultoPreview.filter((_, i) => i !== index),
      };
    });
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

  // ===== VALIDACIONES =====
  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    const { tipoRegistro } = formData;

    if (tipoRegistro === 'adulto') {
      if (!formData.nombreAdulto.trim()) newErrors.nombreAdulto = 'Campo requerido';
      if (!formData.fechaNacimientoAdulto) newErrors.fechaNacimientoAdulto = 'Campo requerido';
      if (!formData.tipoSangreAdulto) newErrors.tipoSangreAdulto = 'Selecciona una opción';
      if (!formData.direccionAdulto.trim()) newErrors.direccionAdulto = 'Campo requerido';
      if (!formData.cedula.trim()) newErrors.cedula = 'Campo requerido';
      else if (!/^\d{7,8}$/.test(formData.cedula.replace(/\D/g, ''))) newErrors.cedula = 'Cédula inválida (7-8 dígitos)';
      if (!formData.fotoAdulto) newErrors.fotoAdulto = 'Foto requerida';
      if (formData.identAdulto.length === 0) newErrors.identAdulto = 'Identificación requerida';
      if (!formData.email.trim()) {
        newErrors.email = 'Campo requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.telefonoContacto.trim()) newErrors.telefonoContacto = 'Campo requerido';
    } else {
      // Menor
      const hijosErrores: { [key: string]: string }[] = [];
      let hasError = false;
      formData.hijos.forEach((hijo, index) => {
        const err: { [key: string]: string } = {};
        if (!hijo.nombre.trim()) { err.nombre = `Nombre del hijo ${index + 1} requerido`; hasError = true; }
        if (!hijo.fechaNacimiento) { err.fechaNacimiento = `Fecha de nacimiento del hijo ${index + 1} requerida`; hasError = true; }
        if (!hijo.tipoSangre) { err.tipoSangre = `Tipo de sangre del hijo ${index + 1} requerido`; hasError = true; }
        if (!hijo.foto) { err.foto = `Foto del hijo ${index + 1} requerida`; hasError = true; }
        if (hijo.identificacion.length === 0) { err.identificacion = `Identificación del hijo ${index + 1} requerida`; hasError = true; }
        hijosErrores.push(err);
      });
      if (hasError) newErrors.hijos = hijosErrores;

      if (!formData.nombreMadre.trim()) newErrors.nombreMadre = 'Campo requerido';
      if (!formData.telefonoMadre.trim()) newErrors.telefonoMadre = 'Campo requerido';
      if (!formData.nombrePadre.trim()) newErrors.nombrePadre = 'Campo requerido';
      if (!formData.telefonoPadre.trim()) newErrors.telefonoPadre = 'Campo requerido';
      if (!formData.direccionPadres.trim()) newErrors.direccionPadres = 'Campo requerido';
      if (!formData.email.trim()) {
        newErrors.email = 'Campo requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
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
      console.log('Datos a enviar:', formData);
      alert('Formulario enviado correctamente (simulado)');
    }
  };

  const handleStart = () => {
    setShowForm(true);
    setStep(1);
    setErrors({});
    setFormData(createInitialFormData());
  };

  // ===== RENDERIZADO =====
  const renderStep1 = () => {
    const { tipoRegistro } = formData;
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-brand-accent border-b pb-3">Datos del Registro</h3>

        {/* Selector de tipo */}
        <div className="bg-stone-100 p-4  border-brand-accent border-1 rounded-lg">
          <label className="block text-base text-brand-accent text-center pb-6 font-medium  mb-2">¿Quién se inscribe? <span className="text-red-500">*</span></label>
          <div className="flex justify-center flex-wrap gap-4">
            <button
              type="button"
              onClick={() => handleTipoRegistro('menor')}
              className={`px-6 py-2 rounded-full border-1 transition  font-medium ${tipoRegistro === 'menor' ? 'border-brand-accent bg-brand-accent/5 text-brand-accent' : 'border-stone-300 text-stone-500 hover:border-stone-400'}`}
            >
              Menor de edad (tutor)
            </button>
            <button
              type="button"
              onClick={() => handleTipoRegistro('adulto')}
              className={`px-6 py-2 rounded-full border-1 transition font-medium ${tipoRegistro === 'adulto' ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-stone-300 text-stone-500 hover:border-stone-400'}`}
            >
              Adulto (mayor de edad)
            </button>
          </div>
        </div>

        {tipoRegistro === 'adulto' ? (
          // ===== ADULTO =====
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Nombre y Apellido <span className="text-red-500">*</span></label>
              <input type="text" name="nombreAdulto" value={formData.nombreAdulto} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.nombreAdulto ? 'border-red-500' : 'border-brand-accent/60'}`} />
              {errors.nombreAdulto && <p className="text-red-500 text-xs mt-1">{errors.nombreAdulto}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Fecha de Nacimiento <span className="text-red-500">*</span></label>
              <input type="date" name="fechaNacimientoAdulto" value={formData.fechaNacimientoAdulto} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.fechaNacimientoAdulto ? 'border-red-500' : 'border-brand-accent/60'}`} />
              {errors.fechaNacimientoAdulto && <p className="text-red-500 text-xs mt-1">{errors.fechaNacimientoAdulto}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Número de Cédula <span className="text-red-500">*</span></label>
              <input type="text" name="cedula" value={formData.cedula} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.cedula ? 'border-red-500' : 'border-brand-accent/60'}`} placeholder="Ej: 12345678" />
              {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.email ? 'border-red-500' : 'border-brand-accent/60'}`} placeholder="correo@ejemplo.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Teléfono de Contacto <span className="text-red-500">*</span></label>
              <input type="tel" name="telefonoContacto" value={formData.telefonoContacto} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.telefonoContacto ? 'border-red-500' : 'border-brand-accent/60'}`} placeholder="0412-1234567" />
              {errors.telefonoContacto && <p className="text-red-500 text-xs mt-1">{errors.telefonoContacto}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Tipo de Sangre <span className="text-red-500">*</span></label>
              <div className="relative">
                <select name="tipoSangreAdulto" value={formData.tipoSangreAdulto} onChange={handleChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition appearance-none ${errors.tipoSangreAdulto ? 'border-red-500' : 'border-brand-accent/60'}`}>
                  <option value="">Selecciona...</option>
                  {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-500 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.tipoSangreAdulto && <p className="text-red-500 text-xs mt-1">{errors.tipoSangreAdulto}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1">Dirección <span className="text-red-500">*</span></label>
              <input type="text" name="direccionAdulto" value={formData.direccionAdulto} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.direccionAdulto ? 'border-red-500' : 'border-brand-accent/60'}`} placeholder="Calle, sector, ciudad" />
              {errors.direccionAdulto && <p className="text-red-500 text-xs mt-1">{errors.direccionAdulto}</p>}
            </div>

            {/* Archivos adulto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileDropZone
                label="Foto (cara, fondo blanco) *"
                files={formData.fotoAdulto ? [formData.fotoAdulto] : []}
                previews={formData.fotoAdultoPreview ? [formData.fotoAdultoPreview] : []}
                error={errors.fotoAdulto}
                accept="image/*"
                hint="Formatos: JPG, PNG"
                onFiles={(fs) => handleAdultoFoto(fs[0] ?? null)}
                onRemove={handleAdultoFotoRemove}
              />
              <FileDropZone
                label="Identificación (Cédula y/o Pasaporte) *"
                files={formData.identAdulto}
                previews={formData.identAdultoPreview}
                error={errors.identAdulto}
                accept="image/*,.pdf"
                multiple
                hint="Formatos: JPG, PNG, PDF. Puedes subir cédula y pasaporte."
                onFiles={handleAdultoIdentFiles}
                onRemove={handleAdultoIdentRemove}
              />
            </div>
          </div>
        ) : (
          // ===== MENOR =====
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800">Datos de los hijos</h4>
              <p className="text-sm text-blue-600">Agrega uno o más hijos. Todos los campos son obligatorios.</p>
            </div>

            {formData.hijos.map((hijo, index) => (
              <div key={hijo.id} className="border border-stone-200 rounded-lg p-4 space-y-3 relative">
                {formData.hijos.length > 1 && (
                  <button type="button" onClick={() => eliminarHijo(hijo.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm">✕ Eliminar</button>
                )}
                <h5 className="font-medium text-stone-700">Hijo #{index + 1}</h5>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Nombre y Apellido <span className="text-red-500">*</span></label>
                  <input type="text" value={hijo.nombre} onChange={(e) => handleHijoChange(hijo.id, 'nombre', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.hijos?.[index]?.nombre ? 'border-red-500' : 'border-brand-accent/60'}`} />
                  {errors.hijos?.[index]?.nombre && <p className="text-red-500 text-xs mt-1">{errors.hijos?.[index]?.nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                  <input type="date" value={hijo.fechaNacimiento} onChange={(e) => handleHijoChange(hijo.id, 'fechaNacimiento', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.hijos?.[index]?.fechaNacimiento ? 'border-red-500' : 'border-brand-accent/60'}`} />
                  {errors.hijos?.[index]?.fechaNacimiento && <p className="text-red-500 text-xs mt-1">{errors.hijos?.[index]?.fechaNacimiento}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Tipo de Sangre <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={hijo.tipoSangre} onChange={(e) => handleHijoChange(hijo.id, 'tipoSangre', e.target.value)}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition appearance-none ${errors.hijos?.[index]?.tipoSangre ? 'border-red-500' : 'border-brand-accent/60'}`}>
                      <option value="">Selecciona...</option>
                      {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-500 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.hijos?.[index]?.tipoSangre && <p className="text-red-500 text-xs mt-1">{errors.hijos?.[index]?.tipoSangre}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FileDropZone
                    label="Foto (cara, fondo blanco) *"
                    files={hijo.foto ? [hijo.foto] : []}
                    previews={hijo.fotoPreview ? [hijo.fotoPreview] : []}
                    error={errors.hijos?.[index]?.foto}
                    accept="image/*"
                     hint="Formatos: JPG, PNG"
                    onFiles={(fs) => handleHijoFoto(hijo.id, fs[0] ?? null)}
                    onRemove={() => handleHijoFotoRemove(hijo.id)}
                  />
                  <FileDropZone
                    label="Identificación (Partida de Nac. y/o Pasaporte) *"
                    files={hijo.identificacion}
                    previews={hijo.identPreview}
                    error={errors.hijos?.[index]?.identificacion}
                    accept="image/*,.pdf"
                    multiple
                    hint="Formatos: JPG, PNG, PDF."
                    onFiles={(fs) => handleHijoIdentFiles(hijo.id, fs)}
                    onRemove={(i) => handleHijoIdentRemove(hijo.id, i)}
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={agregarHijo}
              className="w-full py-2 border-2 border-dashed border-brand-accent text-brand-accent rounded-lg hover:bg-brand-accent/5 transition font-medium">
              + Agregar otro hijo
            </button>

            {/* Datos de padres */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-lg font-medium text-stone-700 mb-3">Datos de los Padres/Tutores <span className="text-red-500">*</span></h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Nombre de la Madre</label>
                  <input type="text" name="nombreMadre" value={formData.nombreMadre} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.nombreMadre ? 'border-red-500' : 'border-brand-accent/60'}`} />
                  {errors.nombreMadre && <p className="text-red-500 text-xs mt-1">{errors.nombreMadre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Teléfono de la Madre</label>
                  <input type="tel" name="telefonoMadre" value={formData.telefonoMadre} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.telefonoMadre ? 'border-red-500' : 'border-brand-accent/60'}`} />
                  {errors.telefonoMadre && <p className="text-red-500 text-xs mt-1">{errors.telefonoMadre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Nombre del Padre</label>
                  <input type="text" name="nombrePadre" value={formData.nombrePadre} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.nombrePadre ? 'border-red-500' : 'border-brand-accent/60'}`} />
                  {errors.nombrePadre && <p className="text-red-500 text-xs mt-1">{errors.nombrePadre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">Teléfono del Padre</label>
                  <input type="tel" name="telefonoPadre" value={formData.telefonoPadre} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.telefonoPadre ? 'border-red-500' : 'border-brand-accent/60'}`} />
                  {errors.telefonoPadre && <p className="text-red-500 text-xs mt-1">{errors.telefonoPadre}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-500 mb-1">Dirección de la Familia <span className="text-red-500">*</span></label>
                  <input type="text" name="direccionPadres" value={formData.direccionPadres} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.direccionPadres ? 'border-red-500' : 'border-brand-accent/60'}`} placeholder="Calle, sector, ciudad" />
                  {errors.direccionPadres && <p className="text-red-500 text-xs mt-1">{errors.direccionPadres}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-500 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white text-stone-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${errors.email ? 'border-red-500' : 'border-brand-accent/60'}`} placeholder="correo@ejemplo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep2 = () => {
    const esAdulto = formData.tipoRegistro === 'adulto';

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-stone-800 border-b pb-3">Compromiso y Práctica</h3>

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2">
            ¿Cuántas horas a la semana {esAdulto ? 'puedes' : 'puede tu hijo(a)'} dedicar al entrenamiento y práctica del karate fuera del horario de clases? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {['Menos de 1 hora', '1-2 horas', '3-5 horas', 'Más de 5 horas'].map(opcion => (
              <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                <input type="radio" name="horasPractica" value={opcion} checked={formData.horasPractica === opcion} onChange={handleChange} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500" />
                <span className="text-stone-500">{opcion}</span>
              </label>
            ))}
          </div>
          {errors.horasPractica && <p className="text-red-500 text-xs mt-1">{errors.horasPractica}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2">
            {esAdulto ? '¿Tienes un espacio en casa adecuado para practicar?' : '¿Tu hijo(a) tiene un espacio en casa adecuado para practicar?'} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 flex-wrap">
            {['Si', 'No'].map(opcion => (
              <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                <input type="radio" name="espacioCasa" value={opcion} checked={formData.espacioCasa === opcion} onChange={handleChange} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500" />
                <span className="text-stone-500">{opcion}</span>
              </label>
            ))}
          </div>
          {errors.espacioCasa && <p className="text-red-500 text-xs mt-1">{errors.espacioCasa}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2">
            {esAdulto ? '¿Estás dispuesto(a) a comprometerte a practicar al menos 10-15 minutos al día fuera de las clases?' : '¿Estás dispuesto(a) como padre/madre a asegurar que tu hijo(a) practique al menos 10-15 minutos al día?'} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 flex-wrap">
            {['Si', 'No'].map(opcion => (
              <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                <input type="radio" name="compromisoDiario" value={opcion} checked={formData.compromisoDiario === opcion} onChange={handleChange} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500" />
                <span className="text-stone-500">{opcion}</span>
              </label>
            ))}
          </div>
          {errors.compromisoDiario && <p className="text-red-500 text-xs mt-1">{errors.compromisoDiario}</p>}
        </div>

        {!esAdulto && (
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-2">
              Como padre/madre/tutor, ¿puedes asistir periódicamente a las clases o a los eventos para motivar a tu hijo(a)?
            </label>
            <div className="space-y-2">
              {['Sí, puedo asistir frecuentemente', 'Solo en algunas ocasiones', 'Me resulta difícil asistir'].map(opcion => (
                <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                  <input type="radio" name="asistenciaPadre" value={opcion} checked={formData.asistenciaPadre === opcion} onChange={handleChange} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500" />
                  <span className="text-stone-500">{opcion}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2">
            {esAdulto ? '¿Cómo planeas motivarte para practicar en casa?' : '¿Cómo planeas motivar a tu hijo(a) para que practique en casa?'} <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              esAdulto ? 'Organizando un horario de práctica' : 'Ayudándolo a organizar un horario de práctica',
              esAdulto ? 'Practicando con compañeros o familia' : 'Practicando con él/ella',
              esAdulto ? 'Premiándome por mi esfuerzo' : 'Premiándolo de alguna forma por su esfuerzo',
              esAdulto ? 'Recordándome la importancia del compromiso' : 'Hablando con él/ella sobre la importancia del compromiso',
              'Otras'
            ].map(opcion => (
              <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                <input type="checkbox" checked={formData.metodoMotivacion.includes(opcion)} onChange={() => handleMultiSelect('metodoMotivacion', opcion)} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 rounded" />
                <span className="text-stone-500">{opcion}</span>
              </label>
            ))}
          </div>
          {formData.metodoMotivacion.includes('Otras') && (
            <input type="text" name="otroMetodoMotivacion" value={formData.otroMetodoMotivacion} onChange={handleChange}
              placeholder="Especificar otro método..." className="mt-2 w-full px-4 py-2 border border-brand-accent/60 rounded-lg bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2">
            {esAdulto ? '¿Por qué deseas practicar karate?' : '¿Por qué deseas que tu hijo/a practique karate?'} (Selecciona todas las que apliquen) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {['Mejorar la disciplina', 'Aprender defensa personal', 'Desarrollar confianza y autoestima', 'Mejorar la condición física'].map(opcion => (
              <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                <input type="checkbox" checked={formData.razonesKarate.includes(opcion)} onChange={() => handleMultiSelect('razonesKarate', opcion)} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 rounded" />
                <span className="text-stone-500">{opcion}</span>
              </label>
            ))}
          </div>
          {errors.razonesKarate && <p className="text-red-500 text-xs mt-1">{errors.razonesKarate}</p>}
          <input type="text" name="otraRazon" value={formData.otraRazon} onChange={handleChange}
            placeholder="Otra razón..." className="mt-2 w-full px-4 py-2 border border-brand-accent/60 rounded-lg bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2">
            {esAdulto ? '¿Estás comprometido(a) a continuar con el entrenamiento incluso cuando surjan obstáculos como el cansancio, la falta de tiempo o la desmotivación?' : '¿Estás comprometido(a) como padre/madre a apoyar a tu hijo(a) para que continúe con el entrenamiento incluso cuando surjan obstáculos?'} <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              esAdulto ? 'Sí, entiendo que el progreso requiere constancia' : 'Sí, entiendo que el progreso requiere constancia y apoyo',
              'Dependerá de las circunstancias',
              'No estoy seguro'
            ].map(opcion => (
              <label key={opcion} className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition">
                <input type="radio" name="compromisoObstaculos" value={opcion} checked={formData.compromisoObstaculos === opcion} onChange={handleChange} className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500" />
                <span className="text-stone-500">{opcion}</span>
              </label>
            ))}
          </div>
          {errors.compromisoObstaculos && <p className="text-red-500 text-xs mt-1">{errors.compromisoObstaculos}</p>}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
        <p className="text-stone-500 text-sm">A continuación le presentaremos un resumen de algunas de las reglas relevantes contenidas en las políticas de la escuela suministradas vía WhatsApp. En el caso de no aceptar alguna de ellas, ponerse en contacto con el Sensei Encargado para aclarar cualquier inquietud, de lo contrario no podrá ser admitido en la escuela.</p>
        <p className="text-stone-500 text-sm mt-2 italic">El karate Do es un estudio de por vida, por lo que entendemos que debe existir buena comunicación entre los alumnos y los maestros.</p>
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
          <div key={name} className={`p-4 border rounded-lg transition ${formData[name as keyof FormData] ? 'border-green-300 bg-green-50' : errors[name as keyof FormData] ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}>
            <label className="flex items-start cursor-pointer">
              <input type="checkbox" name={name} checked={!!formData[name as keyof FormData]} onChange={handleChange} className="mt-1 mr-3 h-5 w-5 text-red-600 focus:ring-red-500 rounded" />
              <span className="text-stone-500 font-medium">{label}</span>
            </label>
            {errors[name as keyof FormData] && <p className="text-red-500 text-xs mt-2 ml-8">{errors[name as keyof FormData]}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  // ===== RENDER PRINCIPAL =====
  return (
    <>
      {!showForm ? (
        <WelcomeScreen onStart={handleStart} onNavigateToHome={() => router.push('/')} />
      ) : (
        <div ref={formRef} className="min-h-screen bg-white py-8 px-4" style={{ backgroundImage: `url(${heroImageDesktop})`, backgroundSize: 'fixed', backgroundPosition: 'center' }}>
          <div className="absolute inset-x-0 top-0 -bottom-[2px] z-0 pointer-events-none bg-gradient-to-br from-stone-900/95 via-blue-950/50 to-blue-900 bg-opacity-80 backdrop-blur-md to-transparent" />
          <div className="max-w-3xl mx-auto z-10 relative">
            <div className="text-center mb-8">
              <h1 ref={titleRef} tabIndex={-1} className="text-3xl md:text-4xl font-bold text-white mb-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-md">
                Formulario de Inscripción
              </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Barra de progreso */}
              <div className="bg-gray-700 text-white p-6">
                <p className="text-sm text-stone-300 mb-2">Bienvenido y gracias por estar aquí, por favor llenar los campos requeridos para completar el proceso de inscripción.</p>
                <div className="flex items-center justify-between mt-4">
                  {['Datos Personales', 'Compromiso', 'Políticas'].map((label, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-brand-accent text-white' : 'bg-stone-600 text-stone-300'}`}>
                        {step > index + 1 ? '✓' : index + 1}
                      </div>
                      <span className={`ml-2 text-sm hidden sm:inline ${step === index + 1 ? 'text-white' : 'text-stone-400'}`}>{label}</span>
                      {index < 2 && <div className="w-12 sm:w-24 h-0.5 mx-2 bg-stone-600"></div>}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <div className="flex justify-between mt-8 pt-6 border-t">
                  {step > 1 ? (
                    <button type="button" onClick={handleBack} className="px-6 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition font-medium">← Anterior</button>
                  ) : (
                    <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition font-medium">← Volver</button>
                  )}
                  {step < 3 ? (
                    <button type="button" onClick={handleNext} className="px-8 py-2 text-white rounded-lg bg-brand-accent transition font-medium">Siguiente →</button>
                  ) : (
                    <button type="submit" className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">Enviar Inscripción</button>
                  )}
                </div>
              </form>
            </div>
            <p className="text-center text-white text-sm mt-6">* Indica que la pregunta es obligatoria</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ToseiGusokuForm;