'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import {
  FileCheck,
  Compass,
  Layers,
  Database,
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Code2,
} from 'lucide-react';

export function DeliverableDocumentationView() {
  const { setRole, setCurrentRoute } = useDojo();
  const [activeSection, setActiveSection] = useState<'map' | 'inventory' | 'model' | 'permissions' | 'flows' | 'states'>('map');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#161616] to-[#1c1c1c] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-[#2A2A2A] space-y-3">
        <div className="flex items-center gap-2 text-[#00FFFF] text-xs font-bold uppercase tracking-wider">
          <FileCheck className="w-4 h-4" />
          <span>Entregable Oficial Google Studio • Karate Track MVP</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Documentación de Arquitectura, Flujos y Matriz de Permisos
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
          Diseño integral para el prototipo funcional de Karate Shito-Ryu Inoue Ha: especificación de componentes reutilizables, modelo de datos relacional/NoSQL, control de acceso basado en roles (RBAC) y los 4 flujos obligatorios.
        </p>
      </div>

      {/* Navigation Pills for Documentation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-[#161616] p-1.5 rounded-xl border border-[#2A2A2A]">
        <button
          type="button"
          onClick={() => setActiveSection('map')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            activeSection === 'map'
              ? 'bg-[#D10000] text-white shadow-sm'
              : 'text-gray-400 hover:bg-[#222222] hover:text-white'
          }`}
        >
          1. Mapa de Navegación
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('inventory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            activeSection === 'inventory'
              ? 'bg-[#D10000] text-white shadow-sm'
              : 'text-gray-400 hover:bg-[#222222] hover:text-white'
          }`}
        >
          2. Inventario Componentes
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('model')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            activeSection === 'model'
              ? 'bg-[#D10000] text-white shadow-sm'
              : 'text-gray-400 hover:bg-[#222222] hover:text-white'
          }`}
        >
          3. Modelo de Datos
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('permissions')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            activeSection === 'permissions'
              ? 'bg-[#D10000] text-white shadow-sm'
              : 'text-gray-400 hover:bg-[#222222] hover:text-white'
          }`}
        >
          4. Tabla de Permisos (RBAC)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('flows')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            activeSection === 'flows'
              ? 'bg-[#D10000] text-white shadow-sm'
              : 'text-gray-400 hover:bg-[#222222] hover:text-white'
          }`}
        >
          5. Flujos de Usuario (4)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('states')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            activeSection === 'states'
              ? 'bg-[#D10000] text-white shadow-sm'
              : 'text-gray-400 hover:bg-[#222222] hover:text-white'
          }`}
        >
          6. Matriz de Estados
        </button>
      </div>

      {/* SECTION 1: MAPA DE NAVEGACIÓN */}
      {activeSection === 'map' && (
        <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-5">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Compass className="w-5 h-5 text-[#D10000]" />
            <h3>1. Mapa de Navegación por Rol</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rol 1: Estudiante */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#D4AF37] bg-amber-950/50 border border-amber-900/30 px-2 py-0.5 rounded">
                  Rol: Estudiante
                </span>
                <span className="text-[11px] text-gray-400">Consulta</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/dashboard:</span>
                  <span className="text-gray-300">Resumen general, próxima clase y barra de progreso a próximo grado.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/katas:</span>
                  <span className="text-gray-300">Malla técnica completa del próximo grado, pautas de examen y observaciones.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/horario:</span>
                  <span className="text-gray-300">Sesiones semanales de tatami y registro de asistencias mensuales.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/perfil:</span>
                  <span className="text-gray-300">Datos del dojo, matrícula oficial, fecha de inicio y sensei a cargo.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setCurrentRoute('student-dashboard');
                }}
                className="w-full py-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-white border border-[#444444] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Ver vistas de Estudiante
              </button>
            </div>

            {/* Rol 2: Instructor */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#00FFFF] bg-cyan-950/50 border border-cyan-900/30 px-2 py-0.5 rounded">
                  Rol: Instructor / Sensei
                </span>
                <span className="text-[11px] text-gray-400">Evaluación</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#00FFFF]">/evaluacion:</span>
                  <span className="text-gray-300">Selector de alumno y control segmentado de estado por kata en tiempo real.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#00FFFF]">/alumnos:</span>
                  <span className="text-gray-300">Directorio con % de avance de katas y alertas de alumnos listos para examen.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#00FFFF]">/horario:</span>
                  <span className="text-gray-300">Agenda semanal de clases e impartición de katas según syllabus.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  setRole('instructor');
                  setCurrentRoute('instructor-eval');
                }}
                className="w-full py-1.5 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/30 border border-[#00FFFF]/40 text-[#00FFFF] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Ver vistas de Instructor
              </button>
            </div>

            {/* Rol 3: Administrador */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#D10000] bg-red-950/50 border border-red-900/30 px-2 py-0.5 rounded">
                  Rol: Administrador
                </span>
                <span className="text-[11px] text-gray-400">Control Total</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/curriculo:</span>
                  <span className="text-gray-300">Catálogo de cinturones, vinculación de katas a grados y orden pedagógico.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/alumnos:</span>
                  <span className="text-gray-300">Padrón general con filtros de rango, sede, y asistencias.</span>
                </li>
                <li className="p-2 bg-[#222222] rounded-lg border border-[#333333] flex items-start gap-2">
                  <span className="font-bold text-[#D10000]">/ficha-alumno:</span>
                  <span className="text-gray-300">Expediente individual, historial de katas y diálogo de ascenso de grado.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setCurrentRoute('admin-curriculum');
                }}
                className="w-full py-1.5 bg-[#D10000] hover:bg-[#B30000] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Ver vistas de Administrador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INVENTARIO DE COMPONENTES */}
      {activeSection === 'inventory' && (
        <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Layers className="w-5 h-5 text-[#D10000]" />
            <h3>2. Inventario de los 10 Componentes Reutilizables</h3>
          </div>

          <div className="divide-y divide-[#2A2A2A] text-xs">
            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">1. AppShell</span>
              <span className="text-gray-400">Desktop sidebar + Mobile bottom nav</span>
              <span className="text-gray-300 sm:col-span-2">
                Header con selector rápido de rol, notificaciones, toast flotante y drawer adaptable.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">2. BeltRankIndicator</span>
              <span className="text-gray-400">Tallas: &apos;sm&apos;, &apos;md&apos;, &apos;lg&apos;</span>
              <span className="text-gray-300 sm:col-span-2">
                Representación fiel del obi con línea central, puntera negra y texto tipográfico de contraste.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">3. GradoProgress</span>
              <span className="text-gray-400">Normal, 100% Examen, 1.º Dan</span>
              <span className="text-gray-300 sm:col-span-2">
                Calcula (mastered / required next rank) * 100. Incluye nota pedagógica y aviso de culminación.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">4. KataBadge</span>
              <span className="text-gray-400">NO_INICIADA, EN_PRACTICA, APROBADA</span>
              <span className="text-gray-300 sm:col-span-2">
                Insignia accesible combinando color, icono específico y fecha de aprobación si aplica.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">5. KataStatusControl</span>
              <span className="text-gray-400">Segmented Control (3 botones)</span>
              <span className="text-gray-300 sm:col-span-2">
                Control para instructores con confirmación obligatoria al revertir una kata desde &apos;Dominada&apos;.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">6. KataList</span>
              <span className="text-gray-400">Modos: &apos;student&apos;, &apos;instructor&apos;, &apos;admin&apos;</span>
              <span className="text-gray-300 sm:col-span-2">
                Filtros por estado, buscador en vivo, llamada a pautas de examen y observaciones de sensei.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">7. StudentPicker</span>
              <span className="text-gray-400">Layouts: &apos;carousel&apos; y &apos;list&apos;</span>
              <span className="text-gray-300 sm:col-span-2">
                Buscador por nombre/matrícula, avatar, rango actual y porcentaje individual con selección activa.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">8. RankCatalog</span>
              <span className="text-gray-400">Tira horizontal deslizable de grados</span>
              <span className="text-gray-300 sm:col-span-2">
                Visualización de cinturones con kyu, meses sugeridos y acciones de administración técnica.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">9. KataAssignmentDialog</span>
              <span className="text-gray-400">Modal selector múltiple con buscador</span>
              <span className="text-gray-300 sm:col-span-2">
                Checkboxes, categorías (Básico, Intermedio, Avanzado), contador &ldquo;X de Y&rdquo; y botón de guardado.
              </span>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-white">10. AssignRankDialog</span>
              <span className="text-gray-400">Modal oficial de ascenso</span>
              <span className="text-gray-300 sm:col-span-2">
                Selector de nuevo grado, examinador, fecha y aviso de recálculo automático de la meta siguiente.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MODELO DE DATOS */}
      {activeSection === 'model' && (
        <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Database className="w-5 h-5 text-[#D10000]" />
            <h3>3. Modelo Conceptual de Datos y Relaciones</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <h4 className="font-bold text-white">1. BeltRank (Grados)</h4>
              <p className="text-gray-400">
                id, name, japaneseName, order (secuencial), beltColor, beltSecondaryColor, estimatedDurationMonths, schoolId, isMaximumRank (boolean).
              </p>
              <div className="text-[11px] text-gray-500">
                Relación 1:N con RankKataRequirement.
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <h4 className="font-bold text-white">2. Kata (Formas)</h4>
              <p className="text-gray-400">
                id, name, kanji, description, movementsCount, embusen, category (&apos;Básico&apos;|&apos;Intermedio&apos;|&apos;Avanzado&apos;|&apos;Maestro&apos;), schoolId.
              </p>
              <div className="text-[11px] text-gray-500">
                Reutilizable en múltiples grados según la malla curricular del dojo.
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <h4 className="font-bold text-white">3. RankKataRequirement (Asociación Grado-Kata)</h4>
              <p className="text-gray-400">
                id, rankId, kataId, requiredOrder, required (boolean).
              </p>
              <div className="text-[11px] text-gray-500">
                Permite asociar una kata a más de un cinturón con órdenes de enseñanza específicos.
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <h4 className="font-bold text-white">4. StudentKata (Progreso Individual)</h4>
              <p className="text-gray-400">
                id, studentId, kataId, status (&apos;NO_INICIADA&apos;|&apos;EN_PRACTICA&apos;|&apos;APROBADA&apos;), approvedAt, approvedBySenseiId, notes.
              </p>
              <div className="text-[11px] text-gray-500">
                Almacena el estado de la kata, timestamp de aprobación y observaciones del Sensei.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#00FFFF]/30 text-xs text-[#00FFFF]">
            <strong className="block font-bold">Fórmula de Progreso Implementada:</strong>
            <code className="text-xs bg-[#222222] text-white px-2 py-0.5 rounded border border-[#333333] font-mono mt-1 inline-block">
              Progreso = (Katas Dominadas asociadas al siguiente grado / Total de katas requeridas para el siguiente grado) * 100
            </code>
            <p className="mt-1 text-[11px] text-gray-400">
              Las katas del grado actual o anteriores se mantienen en el historial y NO computan en el cálculo de pase.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 4: TABLA DE PERMISOS */}
      {activeSection === 'permissions' && (
        <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-[#D10000]" />
            <h3>4. Tabla de Permisos por Rol (RBAC)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-[#2A2A2A] rounded-lg overflow-hidden">
              <thead className="bg-[#1A1A1A] text-gray-300 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">Operación Técnica</th>
                  <th className="p-3 text-center">Estudiante</th>
                  <th className="p-3 text-center">Instructor</th>
                  <th className="p-3 text-center">Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
                <tr>
                  <td className="p-3 font-medium text-white">Ver progreso personal y pautas</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Calificar estado de kata (Dominada / En progreso)</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Revertir una kata dominada</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-[#D4AF37] font-bold">✓ Con confirmación</td>
                  <td className="p-3 text-center text-[#D4AF37] font-bold">✓ Con confirmación</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Asignar / desvincular katas de un grado</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Promover a un alumno de cinturón (Ascenso)</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-white">Crear o eliminar grados del escalafón</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-gray-600">✗ No</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">✓ Sí</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: FLUJOS DE USUARIO */}
      {activeSection === 'flows' && (
        <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <GitPullRequest className="w-5 h-5 text-[#D10000]" />
            <h3>5. Los 4 Flujos de Usuario Interactivos Obligatorios</h3>
          </div>

          <div className="space-y-4">
            {/* Flujo 1 */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  Flujo 1: Estudiante revisa el avance a su siguiente grado
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setRole('student');
                    setCurrentRoute('student-katas');
                  }}
                  className="text-xs text-[#00FFFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Probar Flujo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                1. El estudiante ingresa a &ldquo;Mi grado y katas&rdquo;.
                2. Visualiza el Bento Card con su grado actual (Amarillo 9.º kyu) y próximo objetivo (Naranja 8.º kyu).
                3. La barra de progreso muestra 3 de 8 katas (37.5%).
                4. Filtra por &ldquo;Por practicar&rdquo;, &ldquo;En progreso&rdquo; y &ldquo;Dominadas&rdquo;.
                5. Hace clic en &ldquo;Ver pautas de examen&rdquo; de una kata y consulta los criterios de postura (Dachi), impacto (Kime), mirada (Chudan Metsuke) y grito (Kiai).
              </p>
            </div>

            {/* Flujo 2 */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  Flujo 2: Instructor marca una kata como dominada
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setRole('instructor');
                    setCurrentRoute('instructor-eval');
                  }}
                  className="text-xs text-[#00FFFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Probar Flujo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                1. El Sensei selecciona a Sofía Martínez en el carrusel de alumnos.
                2. Ubica la kata &ldquo;Heian Sandan&rdquo; (en progreso).
                3. Presiona el botón &ldquo;Dominada&rdquo; en el segmented control.
                4. El sistema actualiza optimísticamente el progreso a 50% (4 de 8) y estampa la fecha de aprobación técnica.
                5. Si el instructor intenta cambiar de &ldquo;Dominada&rdquo; a &ldquo;Por practicar&rdquo;, el sistema abre un modal de confirmación obligatorio advirtiendo que se eliminará la acreditación.
              </p>
            </div>

            {/* Flujo 3 */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  Flujo 3: Administrador asigna katas a un grado
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setCurrentRoute('admin-curriculum');
                  }}
                  className="text-xs text-[#00FFFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Probar Flujo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                1. El Administrador accede a &ldquo;Gestión de grados y katas&rdquo;.
                2. Selecciona &ldquo;Cinturón marrón (3.º kyu)&rdquo; en el catálogo de cinturones.
                3. Abre el diálogo &ldquo;Asignar Katas al Grado&rdquo;.
                4. Utiliza el buscador para filtrar formas intermedias/avanzadas, marca las casillas requeridas y observa el contador &ldquo;X katas seleccionadas&rdquo;.
                5. Presiona &ldquo;Guardar asignación&rdquo;. El grado se actualiza y la lista refleja los nuevos requisitos ordenados.
              </p>
            </div>

            {/* Flujo 4 */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  Flujo 4: Administrador asciende a un alumno de grado
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setCurrentRoute('admin-student-detail');
                  }}
                  className="text-xs text-[#00FFFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Probar Flujo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                1. El Administrador abre la ficha de expediente de Sofía Martínez.
                2. Verifica que su asistencia cumpla el 85% y presiona &ldquo;+ Asignar nuevo grado&rdquo;.
                3. El diálogo selecciona automáticamente el siguiente rango en el syllabus (&ldquo;Cinturón naranja · 8.º kyu&rdquo;).
                4. Confirma el ascenso de grado.
                5. El sistema actualiza el registro de Sofía y recalcula automáticamente su meta siguiente al escalafón sucesivo (Cinturón verde · 7.º kyu).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: MATRIZ DE ESTADOS */}
      {activeSection === 'states' && (
        <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3>6. Matriz de Estados de la Interfaz</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
              <span className="font-bold text-white block">Cargando (Loading)</span>
              <p className="text-gray-400">
                Skeletons visuales con shimmer en las listas de alumnos y tarjetas de perfil mientras se resuelven las lecturas de base de datos.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
              <span className="font-bold text-white block">Vacío (Empty State)</span>
              <p className="text-gray-400">
                Ilustraciones y mensajes pedagógicos claros cuando un grado no tiene katas vinculadas o no hay alumnos coincidentes con la búsqueda.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
              <span className="font-bold text-white block">Confirmación (Confirm)</span>
              <p className="text-gray-400">
                Modales de advertencia destructiva al revertir una kata desde &apos;Dominada&apos; o al desvincular una kata de un cinturón.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
              <span className="font-bold text-white block">Éxito (Success Toast)</span>
              <p className="text-gray-400">
                Notificaciones toast flotantes con animación suave al guardar evaluaciones, actualizar mallas técnicas o registrar ascensos.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
              <span className="font-bold text-white block">100% Cumplido (Ready)</span>
              <p className="text-gray-400">
                Banner dorado con fuegos de culminación técnica invitando a solicitar revisión de grado y ver fecha de examen.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
              <span className="font-bold text-white block">Grado Máximo (1.º Dan)</span>
              <p className="text-gray-400">
                Insignia especial negra/dorada de Yudansha que desactiva barras de progreso porcentual y destaca la filosofía Budo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
