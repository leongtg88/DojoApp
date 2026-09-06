'use client';

import React, { useState } from 'react';
import {
  mockStudentProfile,
  mockBeltRank,
  mockIdentityDocuments,
} from '@/data/mock-data';
import {
  StudentProfile,
  IdentityDocument,
} from '@/types/dashboard';
import { EditProfileModal } from '@/components/dashboard/EditProfileModal';
import { UploadDocumentModal } from '@/components/dashboard/UploadDocumentModal';
import { DocumentCard } from '@/components/dashboard/DocumentCard';
import {
  User,
  Shield,
  Camera,
  Trash2,
  Edit3,
  CheckCircle2,
  FileCheck2,
  X,
  Eye,
  AlertTriangle,
  Upload,
} from 'lucide-react';

export default function MisDatosPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'docs'>('info');
  const [profile, setProfile] = useState<StudentProfile>(mockStudentProfile);
  const [documents, setDocuments] = useState<IdentityDocument[]>(
    mockIdentityDocuments
  );

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetUploadDocType, setTargetUploadDocType] =
    useState<IdentityDocument['type']>('Cédula de identidad');

  // Preview & Delete Confirmation Modals
  const [previewDoc, setPreviewDoc] = useState<IdentityDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<IdentityDocument | null>(null);

  // Photo state
  const [hasCustomPhoto, setHasCustomPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);

  const completedDocsCount = documents.filter(
    (d) => d.status === 'Aprobado' || d.status === 'En revisión'
  ).length;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHasCustomPhoto(true);
      setPhotoFeedback(`Foto de perfil cargada: ${file.name}`);
      setTimeout(() => setPhotoFeedback(null), 3500);
    }
  };

  const handleRemovePhoto = () => {
    setHasCustomPhoto(false);
    setPhotoFeedback('Se ha restablecido el monograma oficial de tatami.');
    setTimeout(() => setPhotoFeedback(null), 3500);
  };

  const handleUploadSuccess = (uploaded: {
    type: IdentityDocument['type'];
    fileName: string;
    fileSize: string;
  }) => {
    setDocuments((prev) => {
      const index = prev.findIndex((d) => d.type === uploaded.type);
      const updatedDoc: IdentityDocument = {
        id: index >= 0 ? prev[index].id : `doc-${Date.now()}`,
        type: uploaded.type,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        status: 'En revisión',
        uploadedAt: 'Hoy',
        rejectionReason: undefined,
      };

      if (index >= 0) {
        const next = [...prev];
        next[index] = updatedDoc;
        return next;
      }
      return [updatedDoc, ...prev];
    });
  };

  const openUploadFor = (type: IdentityDocument['type']) => {
    setTargetUploadDocType(type);
    setIsUploadModalOpen(true);
  };

  const confirmDelete = () => {
    if (!docToDelete) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docToDelete.id
          ? {
              ...d,
              status: 'Pendiente de carga',
              fileName: undefined,
              uploadedAt: undefined,
              fileSize: undefined,
              rejectionReason: undefined,
            }
          : d
      )
    );
    setDocToDelete(null);
  };

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-5 max-w-4xl mx-auto">
      {/* Segmented Navigation Bar (Información Personal vs Documentos de Identidad) */}
      <section className="bg-[#F6F3F2] p-1 rounded-xl flex items-center justify-between shadow-xs border border-[#E5E2E1]">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'info'
              ? 'bg-white text-[#B70011] shadow-xs'
              : 'text-[#5C403C] hover:text-[#1C1B1B]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Información Personal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'docs'
              ? 'bg-white text-[#B70011] shadow-xs'
              : 'text-[#5C403C] hover:text-[#1C1B1B]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Documentos de Identidad</span>
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
        </button>
      </section>

      {/* ======================================================== */}
      {/* TAB 1: INFORMACIÓN PERSONAL                              */}
      {/* ======================================================== */}
      {activeTab === 'info' && (
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Profile Photo Card */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E2E1]/60">
              <span className="w-1 h-3.5 bg-[#B8B070] rounded-sm" />
              <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] uppercase tracking-tight">
                Retrato de Registro
              </h2>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative shrink-0">
                {hasCustomPhoto ? (
                  <div className="w-20 h-20 rounded-full bg-[#EBE7E7] border-2 border-[#B8B070] flex items-center justify-center text-xs font-bold text-[#1C1B1B] shadow-md overflow-hidden">
                    <span className="text-2xl">🥋</span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#B70011] flex items-center justify-center text-white font-display text-xl font-extrabold shadow-md tracking-wider border-2 border-white">
                    AS
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-[#666028] flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] truncate">
                  {profile.fullName}
                </span>
                <span className="text-xs text-[#5C403C]">
                  Formatos permitidos: JPG, PNG o WEBP (Máx. 3 MB o 5 MB).
                </span>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEE49F] text-[#1F1C00] text-[11px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cambiar foto</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {hasCustomPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#DC2626] hover:bg-[#DC2626]/10 text-[11px] font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar foto</span>
                    </button>
                  )}
                </div>

                {photoFeedback && (
                  <p className="text-[11px] font-semibold text-[#00617F] mt-1">
                    {photoFeedback}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Section: Información Institucional */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E2E1]/60">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-[#DC2626] rounded-sm" />
                <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] uppercase tracking-tight">
                  Registro Institucional
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider">
                DOJO HONBU
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Grado Actual
                </span>
                <span className="font-display text-base font-extrabold text-[#1C1B1B] mt-1">
                  {mockBeltRank.currentRankName}
                </span>
                <span className="text-xs text-[#666028] font-semibold">
                  {mockBeltRank.currentRankBeltColor}
                </span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Programa
                </span>
                <span className="font-display text-base font-extrabold text-[#1C1B1B] mt-1">
                  {profile.program}
                </span>
                <span className="text-xs text-[#5C403C]">División Adultos</span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Sucursal
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold mt-1 truncate">
                  {profile.branch}
                </span>
                <span className="text-[11px] text-[#5C403C]">Sede Activa</span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Fecha de Ingreso
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold mt-1">
                  {profile.joinedDate}
                </span>
                <span className="text-xs text-[#666028] font-semibold">
                  {profile.joinedAntiquity}
                </span>
              </div>
            </div>
          </section>

          {/* Section: Información Personal (Read-Only fields) */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E2E1]/60">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-[#B8B070] rounded-sm" />
                <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] uppercase tracking-tight">
                  Identidad &amp; Contacto
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-[#666028] hover:text-[#1C1B1B] flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Nombres
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.firstName}
                </span>
              </div>

              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Apellidos
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.lastName}
                </span>
              </div>

              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Fecha de Nacimiento
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.birthDate} ({profile.age} años)
                </span>
              </div>

              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Sexo
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.gender || 'No especificado'}
                </span>
              </div>

              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Teléfono
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.phone}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg gap-1">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Correo Electrónico
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold truncate text-right">
                  {profile.email}
                </span>
              </div>

              <div className="flex flex-col py-2 bg-[#F6F3F2] px-3 rounded-lg gap-1">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Dirección de Residencia
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold">
                  {profile.address || 'Sin registrar'}
                </span>
              </div>
            </div>
          </section>

          {/* Section: Medidas y Tallas */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E2E1]/60">
              <span className="w-1 h-3.5 bg-[#B8B070] rounded-sm" />
              <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] uppercase tracking-tight">
                Medidas y Tallas
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Franela / Karategi
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-bold mt-1">
                  {profile.uniformAndSizes.karategi}
                </span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Talla Pantalón
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-bold mt-1">
                  {profile.uniformAndSizes.pantSize}
                </span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Altura
                </span>
                <span className="font-display text-base font-bold text-[#1C1B1B] mt-1">
                  {profile.uniformAndSizes.height} m
                </span>
                <span className="text-[10px] text-[#666028] font-semibold">
                  Registro biométrico
                </span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#5C403C] uppercase tracking-wider font-bold">
                  Peso
                </span>
                <span className="font-display text-base font-bold text-[#1C1B1B] mt-1">
                  {profile.uniformAndSizes.weight} kg
                </span>
                <span className="text-[10px] text-[#5C403C]">Categoría Medio</span>
              </div>
            </div>
          </section>

          {/* Section: Información de Emergencia */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E2E1]/60">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-[#DC2626] rounded-sm" />
                <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] uppercase tracking-tight">
                  Información de Emergencia
                </h2>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DC2626] text-white text-xs font-bold shadow-xs">
                <span>Tipo:</span>
                <span>{profile.emergencyContact.bloodType || 'O+'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Titular de Contacto
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.emergencyContact.name}
                </span>
              </div>

              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Parentesco
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold text-right">
                  {profile.emergencyContact.relationship}
                </span>
              </div>

              <div className="flex justify-between items-baseline py-2 bg-[#F6F3F2] px-3 rounded-lg">
                <span className="text-xs text-[#5C403C] uppercase font-semibold">
                  Teléfono de Emergencia
                </span>
                <span className="text-xs sm:text-sm text-[#DC2626] font-bold text-right">
                  {profile.emergencyContact.phone}
                </span>
              </div>
            </div>
          </section>

          {/* Section: Información Médica */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E2E1]/60">
              <span className="w-1 h-3.5 bg-[#00617F] rounded-sm" />
              <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] uppercase tracking-tight">
                Información Médica
              </h2>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] text-[#5C403C] uppercase font-bold">
                  Condición Cardiovascular
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold">
                  {profile.medicalInfo.cardiovascularCondition}
                </span>
              </div>

              <div className="bg-[#DC2626]/10 p-3 rounded-lg flex flex-col gap-1 border border-[#DC2626]/20">
                <div className="flex items-center gap-1.5 text-[#DC2626]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">
                    Alergias Conocidas
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-[#DC2626] font-bold">
                  {profile.medicalInfo.allergies || 'Ninguna registrada'}
                </span>
              </div>

              <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] text-[#5C403C] uppercase font-bold">
                  Observaciones Relevantes
                </span>
                <span className="text-xs sm:text-sm text-[#1C1B1B] font-semibold">
                  {profile.medicalInfo.physicalObservations}
                </span>
              </div>
            </div>
          </section>

          {/* Action Button: Edit Profile */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#EEE49F] hover:bg-[#D1C886] text-[#1F1C00] font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar datos personales</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DOCUMENTOS DE IDENTIDAD                           */}
      {/* ======================================================== */}
      {activeTab === 'docs' && (
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Vault Status Banner */}
          <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#DC2626]" />
                <h2 className="font-display text-sm sm:text-base uppercase tracking-wider text-[#1C1B1B] font-extrabold">
                  Expediente Oficial del Alumno
                </h2>
              </div>
              <span className="text-xs font-bold text-[#666028]">
                {completedDocsCount} de {documents.length} verificados
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full bg-[#E5E2E1] h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className={`h-full flex-1 rounded-xs transition-all ${
                    doc.status === 'Aprobado'
                      ? 'bg-[#666028]'
                      : doc.status === 'En revisión'
                      ? 'bg-[#00617F]'
                      : doc.status === 'Requiere actualización'
                      ? 'bg-[#DC2626] animate-pulse'
                      : 'bg-[#E5E2E1]'
                  }`}
                  title={`${doc.type}: ${doc.status}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <p className="text-xs text-[#5C403C]">
                Mantén tus documentos actualizados para habilitar tu inscripción a exámenes de grado y torneos.
              </p>
              <button
                type="button"
                onClick={() => openUploadFor('Cédula de identidad')}
                className="px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B70011] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir documento</span>
              </button>
            </div>
          </section>

          {/* List of Documents */}
          <section className="flex flex-col gap-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={(d) => setPreviewDoc(d)}
                onReplace={(d) => openUploadFor(d.type)}
                onDelete={(d) => setDocToDelete(d)}
                onUpload={(d) => openUploadFor(d.type)}
              />
            ))}
          </section>
        </div>
      )}

      {/* Profile Edit Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={(updated) => setProfile(updated)}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultDocType={targetUploadDocType}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Document View Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1B1B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-[#E5E2E1] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E2E1] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#666028]" />
                <h3 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B]">
                  Vista Previa del Documento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-[#5C403C] hover:text-[#1C1B1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F6F3F2] p-4 rounded-xl border border-[#E5E2E1] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#666028] uppercase">
                {previewDoc.type}
              </span>
              <span className="text-xs font-bold text-[#1C1B1B]">
                {previewDoc.fileName || 'Archivo institucional'}
              </span>
              <div className="h-40 bg-white rounded-lg border border-[#E5E2E1] flex flex-col items-center justify-center text-center p-4 text-xs text-[#5C403C] gap-2">
                <FileCheck2 className="w-8 h-8 text-[#666028]" />
                <span>Simulación de visor de documento PDF/Imagen</span>
                <span className="text-[10px] text-[#916F6B]">
                  Cifrado con llave institucional Tosei Gusoku Dojo
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-xs font-bold uppercase tracking-wider"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1B1B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[#E5E2E1] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E2E1] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#DC2626] rounded-sm" />
                <h3 className="font-display text-sm font-bold text-[#1C1B1B]">
                  Confirmar Eliminación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="text-[#5C403C] hover:text-[#1C1B1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C403C] leading-relaxed">
              ¿Estás seguro de que deseas desvincular el archivo de{' '}
              <strong className="text-[#1C1B1B]">{docToDelete.type}</strong> del
              expediente? Su estado volverá a{' '}
              <span className="text-[#DC2626] font-semibold">
                &ldquo;Pendiente de carga&rdquo;
              </span>
              .
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B70011] text-white text-xs font-bold uppercase tracking-wider"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
