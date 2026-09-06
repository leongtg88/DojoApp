'use client';

import React from 'react';
import {
  FileText,
  Badge,
  Globe,
  Camera,
  History,
  AlertCircle,
  Eye,
  RefreshCw,
  Trash2,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { IdentityDocument } from '@/types/dashboard';

interface DocumentCardProps {
  document: IdentityDocument;
  onView: (doc: IdentityDocument) => void;
  onReplace: (doc: IdentityDocument) => void;
  onDelete: (doc: IdentityDocument) => void;
  onUpload: (doc: IdentityDocument) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onView,
  onReplace,
  onDelete,
  onUpload,
}) => {
  const getDocumentIcon = () => {
    switch (doc.type) {
      case 'Cédula de identidad':
        return <Badge className="w-5 h-5 text-[#1C1B1B]" />;
      case 'Pasaporte':
        return <Globe className="w-5 h-5 text-[#1C1B1B]" />;
      case 'Foto tipo carnet':
        return <Camera className="w-5 h-5 text-[#00617F]" />;
      case 'Partida de nacimiento':
        return <History className="w-5 h-5 text-[#5C403C]" />;
      case 'Certificado médico anual':
      case 'Documento adicional':
      default:
        return <FileText className="w-5 h-5 text-[#B70011]" />;
    }
  };

  const getStatusBadge = () => {
    switch (doc.status) {
      case 'Aprobado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBE29D] text-[#6A642C] text-[11px] uppercase font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#666028]" />
            <span>Aprobado</span>
          </span>
        );
      case 'En revisión':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#BFE8FF] text-[#004D65] text-[11px] uppercase font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00617F]" />
            <span>En revisión</span>
          </span>
        );
      case 'Requiere actualización':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DC2626]/15 text-[#DC2626] text-[11px] uppercase font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>Requiere actualización</span>
          </span>
        );
      case 'Rechazado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DC2626]/20 text-[#DC2626] text-[11px] uppercase font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>Rechazado</span>
          </span>
        );
      case 'Pendiente de carga':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E5E2E1] text-[#5C403C] text-[11px] uppercase font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#916F6B]" />
            <span>Pendiente de carga</span>
          </span>
        );
    }
  };

  const isPending = doc.status === 'Pendiente de carga';
  const isExpiring = doc.status === 'Requiere actualización';
  const isRejected = doc.status === 'Rechazado';

  return (
    <div
      className={`rounded-xl p-4 shadow-xs border transition-all ${
        isExpiring
          ? 'bg-[#DC2626]/5 border-[#DC2626]/25'
          : isPending
          ? 'bg-white border-dashed border-[#916F6B]/40'
          : 'bg-white border-[#E5E2E1]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isExpiring
                ? 'bg-[#DC2626]/15'
                : isPending
                ? 'bg-[#EBE7E7]'
                : 'bg-[#F0EDEC]'
            }`}
          >
            {getDocumentIcon()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-[#1C1B1B] truncate">
              {doc.type}
            </span>
            <span
              className={`text-[11px] truncate ${
                doc.fileName
                  ? 'text-[#5C403C]'
                  : 'text-[#916F6B] italic'
              }`}
            >
              {doc.fileName
                ? `${doc.fileName} ${doc.fileSize ? `• ${doc.fileSize}` : ''}`
                : 'Sin archivo asociado en el dojo'}
            </span>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Warning/Rejection reason banner if applicable */}
      {doc.rejectionReason && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-[#F0EDEC] border border-[#E5E2E1] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#5C403C] leading-snug">
            <strong className="text-[#1C1B1B]">Observación del Honbu Dojo:</strong>{' '}
            {doc.rejectionReason}
          </p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E5E2E1]/60">
        <span className="text-[11px] text-[#916F6B]">
          {doc.uploadedAt ? `Cargado: ${doc.uploadedAt}` : 'Requerido para pase de grado'}
        </span>

        <div className="flex items-center gap-1.5">
          {isPending ? (
            <button
              type="button"
              onClick={() => onUpload(doc)}
              className="px-3 py-1.5 rounded-lg bg-[#B8B070] hover:bg-[#666028] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir documento</span>
            </button>
          ) : (
            <>
              {doc.fileName && (
                <button
                  type="button"
                  onClick={() => onView(doc)}
                  className="px-2.5 py-1 rounded-lg bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-[11px] font-semibold transition-colors flex items-center gap-1"
                  title="Visualizar documento"
                >
                  <Eye className="w-3.5 h-3.5 text-[#5C403C]" />
                  <span>Ver</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onReplace(doc)}
                className="px-2.5 py-1 rounded-lg bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Reemplazar archivo"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#5C403C]" />
                <span>Reemplazar</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(doc)}
                className="p-1.5 rounded-lg bg-[#F0EDEC] hover:bg-[#DC2626]/15 text-[#DC2626] transition-colors"
                title="Eliminar documento del expediente"
                aria-label={`Eliminar ${doc.type}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
