'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileUp,
} from 'lucide-react';
import { IdentityDocument } from '@/types/dashboard';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDocType?: IdentityDocument['type'];
  onUploadSuccess: (newDoc: {
    type: IdentityDocument['type'];
    fileName: string;
    fileSize: string;
  }) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  defaultDocType = 'Cédula de identidad',
  onUploadSuccess,
}) => {
  const [selectedType, setSelectedType] =
    useState<IdentityDocument['type']>(defaultDocType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Check extension / type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(
      extension || ''
    );

    if (!isValidExt && !validTypes.includes(file.type)) {
      setErrorMessage(
        'Formato no permitido. Solo se aceptan archivos PDF, JPG, PNG o WEBP.'
      );
      setSelectedFile(null);
      return;
    }

    // Check size
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        'El archivo supera el tamaño máximo permitido de 5 MB.'
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = () => {
    if (!selectedFile) {
      setErrorMessage('Por favor selecciona o arrastra un archivo primero.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(100);
            setIsUploading(false);
            setSuccessMessage(
              'Documento cargado con éxito y enviado a revisión por el Honbu Dojo.'
            );
            setTimeout(() => {
              const formattedSize = (selectedFile.size / (1024 * 1024)).toFixed(
                1
              ) + ' MB';
              onUploadSuccess({
                type: selectedType,
                fileName: selectedFile.name,
                fileSize: formattedSize,
              });
              onClose();
            }, 800);
          }, 400);
          return 90;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1B1B]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-[#E5E2E1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E2E1] bg-[#FCF9F8]">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#DC2626] rounded-sm" />
            <h3
              id="upload-modal-title"
              className="font-display text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#1C1B1B]"
            >
              Repositorio Seguro de Documentos
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#F0EDEC] flex items-center justify-center text-[#5C403C] hover:text-[#1C1B1B] transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Selector de Tipo de Documento */}
          <div className="space-y-1.5">
            <label
              htmlFor="upload-doc-select"
              className="block text-xs font-bold text-[#5C403C] uppercase tracking-wider"
            >
              Tipo de Documento Oficial
            </label>
            <select
              id="upload-doc-select"
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as IdentityDocument['type'])
              }
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            >
              <option value="Cédula de identidad">
                Cédula de Identidad / INE
              </option>
              <option value="Pasaporte">Pasaporte Internacional</option>
              <option value="Partida de nacimiento">Partida de Nacimiento</option>
              <option value="Foto tipo carnet">Foto Tipo Carnet (Dobok/Karategi)</option>
              <option value="Certificado médico anual">
                Certificado Médico Anual
              </option>
              <option value="Documento adicional">
                Documento Adicional (Comprobante de domicilio)
              </option>
            </select>
          </div>

          {/* Banner Indicador de Tipo Seleccionado */}
          <div className="bg-[#F6F3F2] p-3 rounded-lg border-l-2 border-[#DC2626] flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[#916F6B]">
              Documento a vincular al expediente
            </span>
            <span className="text-xs font-bold text-[#1C1B1B]">
              {selectedType}
            </span>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl p-6 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${
              isDragging
                ? 'border-[#DC2626] bg-[#DC2626]/5'
                : 'border-[#E5E2E1] hover:border-[#B8B070] bg-[#FCF9F8]'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#EEE49F] flex items-center justify-center text-[#1F1C00] mb-2 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-xs font-bold text-[#1C1B1B]">
              Arrastra tu archivo aquí o presiona para buscar
            </p>
            <p className="text-[11px] text-[#5C403C] mt-1">
              Archivos permitidos: PDF, JPG, PNG y WEBP • Máximo visible: 5 MB
            </p>

            <button
              type="button"
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-[#E5E2E1] hover:bg-[#F0EDEC] text-xs font-bold uppercase tracking-wider text-[#1C1B1B] shadow-xs"
            >
              Seleccionar archivo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Selected File Details & Progress Bar */}
          {selectedFile && (
            <div className="bg-[#F6F3F2] p-3 rounded-xl border border-[#E5E2E1] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span className="text-xs font-semibold text-[#1C1B1B] truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#666028] shrink-0">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-[#5C403C]">
                    <span>Cifrando en bóveda segura...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#E5E2E1] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#DC2626] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-start gap-2 text-xs text-[#DC2626]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-[#EEE49F]/40 border border-[#B8B070] flex items-start gap-2 text-xs text-[#1F1C00]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#666028]" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 p-4 border-t border-[#E5E2E1] bg-[#FCF9F8]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B70011] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            <span>{isUploading ? 'Subiendo...' : 'Subir documento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
