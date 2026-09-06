'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { StudentProfile } from '@/types/dashboard';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (updatedProfile: StudentProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<StudentProfile>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const calculateAge = (birthDateString: string): number => {
    if (!birthDateString) return formData.age;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) ? formData.age : age;
  };

  const handleInputChange = (
    field: keyof StudentProfile,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBirthDateChange = (dateStr: string) => {
    const newAge = calculateAge(dateStr);
    setFormData((prev) => ({
      ...prev,
      birthDate: dateStr,
      age: newAge,
    }));
  };

  const handleEmergencyChange = (
    subField: keyof StudentProfile['emergencyContact'],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [subField]: value,
      },
    }));
  };

  const handleMedicalChange = (
    subField: keyof StudentProfile['medicalInfo'],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [subField]: value,
      },
    }));
  };

  const handleUniformChange = (
    subField: keyof StudentProfile['uniformAndSizes'],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      uniformAndSizes: {
        ...prev.uniformAndSizes,
        [subField]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio.';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son obligatorios.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'Introduce un correo electrónico válido.';
    }
    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergencyName = 'El contacto de emergencia es obligatorio.';
    }
    if (!formData.emergencyContact.phone.trim()) {
      newErrors.emergencyPhone = 'El teléfono de emergencia es obligatorio.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    onSave({
      ...formData,
      fullName,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1B1B]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div
        className="bg-white w-full max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-[#E5E2E1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E2E1] bg-[#FCF9F8]">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#B8B070] rounded-sm" />
            <h3
              id="edit-profile-title"
              className="font-display text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#1C1B1B]"
            >
              Editar Datos Personales
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0EDEC] flex items-center justify-center text-[#5C403C] hover:text-[#1C1B1B] transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Información Personal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E2E1]/60 pb-1.5">
              <span className="text-xs font-bold text-[#666028] uppercase tracking-wider">
                1. Información Personal
              </span>
              <span className="text-[10px] text-[#916F6B]">Campos oficiales</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-firstname"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Nombres *
                </label>
                <input
                  id="input-firstname"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] transition-colors ${
                    errors.firstName ? 'border-[#DC2626]' : 'border-[#E5E2E1]'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="input-lastname"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Apellidos *
                </label>
                <input
                  id="input-lastname"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] transition-colors ${
                    errors.lastName ? 'border-[#DC2626]' : 'border-[#E5E2E1]'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="input-birthdate"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Fecha de Nacimiento
                </label>
                <input
                  id="input-birthdate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label
                  htmlFor="input-age"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Edad (calculada)
                </label>
                <div
                  id="input-age"
                  className="px-3 py-2 text-sm rounded-lg bg-[#EBE7E7] border border-[#E5E2E1] text-[#1C1B1B] font-bold"
                >
                  {formData.age} años
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-gender"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Sexo (Opcional)
                </label>
                <select
                  id="input-gender"
                  value={formData.gender || ''}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro / Prefiero no decir</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="input-phone"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Teléfono *
                </label>
                <input
                  id="input-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] transition-colors ${
                    errors.phone ? 'border-[#DC2626]' : 'border-[#E5E2E1]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="input-email"
                className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
              >
                Correo Electrónico *
              </label>
              <input
                id="input-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] transition-colors ${
                  errors.email ? 'border-[#DC2626]' : 'border-[#E5E2E1]'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-address"
                className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
              >
                Dirección de Residencia (Opcional)
              </label>
              <input
                id="input-address"
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          {/* Section 2: Medidas y Tallas */}
          <div className="space-y-3 pt-3 border-t border-[#E5E2E1]">
            <span className="text-xs font-bold text-[#666028] uppercase tracking-wider block">
              2. Medidas y Tallas Oficiales
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-karategi"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Karategi Superior
                </label>
                <select
                  id="input-karategi"
                  value={formData.uniformAndSizes.karategi}
                  onChange={(e) => handleUniformChange('karategi', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="Talla 3 / S (165 cm)">Talla 3 / S (165 cm)</option>
                  <option value="Talla 4 / M (175 cm)">Talla 4 / M (175 cm)</option>
                  <option value="Talla 5 / L (185 cm)">Talla 5 / L (185 cm)</option>
                  <option value="Talla 6 / XL (195 cm)">Talla 6 / XL (195 cm)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="input-pant"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Talla de Pantalón
                </label>
                <select
                  id="input-pant"
                  value={formData.uniformAndSizes.pantSize}
                  onChange={(e) => handleUniformChange('pantSize', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="S / Regular">S / Regular</option>
                  <option value="M / Regular">M / Regular</option>
                  <option value="L / Long">L / Long</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-height"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Altura (m)
                </label>
                <input
                  id="input-height"
                  type="number"
                  step="0.01"
                  value={formData.uniformAndSizes.height}
                  onChange={(e) =>
                    handleUniformChange('height', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label
                  htmlFor="input-weight"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Peso (kg)
                </label>
                <input
                  id="input-weight"
                  type="number"
                  step="0.5"
                  value={formData.uniformAndSizes.weight}
                  onChange={(e) =>
                    handleUniformChange('weight', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contacto de Emergencia */}
          <div className="space-y-3 pt-3 border-t border-[#E5E2E1]">
            <span className="text-xs font-bold text-[#666028] uppercase tracking-wider block">
              3. Información de Emergencia
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-emergency-name"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Nombre de Contacto *
                </label>
                <input
                  id="input-emergency-name"
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyChange('name', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] ${
                    errors.emergencyName ? 'border-[#DC2626]' : 'border-[#E5E2E1]'
                  }`}
                />
                {errors.emergencyName && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.emergencyName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="input-emergency-rel"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Parentesco
                </label>
                <input
                  id="input-emergency-rel"
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    handleEmergencyChange('relationship', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-emergency-phone"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Teléfono de Emergencia *
                </label>
                <input
                  id="input-emergency-phone"
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] ${
                    errors.emergencyPhone ? 'border-[#DC2626]' : 'border-[#E5E2E1]'
                  }`}
                />
                {errors.emergencyPhone && (
                  <p className="text-[11px] text-[#DC2626] mt-1">
                    {errors.emergencyPhone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="input-bloodtype"
                  className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
                >
                  Tipo de Sangre
                </label>
                <select
                  id="input-bloodtype"
                  value={formData.emergencyContact.bloodType || 'O+'}
                  onChange={(e) => handleEmergencyChange('bloodType', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="O+">O Positivo (O+)</option>
                  <option value="O-">O Negativo (O-)</option>
                  <option value="A+">A Positivo (A+)</option>
                  <option value="A-">A Negativo (A-)</option>
                  <option value="B+">B Positivo (B+)</option>
                  <option value="AB+">AB Positivo (AB+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Información Médica */}
          <div className="space-y-3 pt-3 border-t border-[#E5E2E1]">
            <span className="text-xs font-bold text-[#666028] uppercase tracking-wider block">
              4. Información Médica
            </span>
            <div>
              <label
                htmlFor="input-cardio"
                className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
              >
                Condiciones Médicas / Cardiovascular
              </label>
              <input
                id="input-cardio"
                type="text"
                value={formData.medicalInfo.cardiovascularCondition}
                onChange={(e) =>
                  handleMedicalChange('cardiovascularCondition', e.target.value)
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label
                htmlFor="input-allergies"
                className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
              >
                Alergias Conocidas (Opcional)
              </label>
              <input
                id="input-allergies"
                type="text"
                value={formData.medicalInfo.allergies || ''}
                onChange={(e) => handleMedicalChange('allergies', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label
                htmlFor="input-notes"
                className="block text-xs font-semibold text-[#5C403C] uppercase mb-1"
              >
                Observaciones Relevantes
              </label>
              <textarea
                id="input-notes"
                rows={2}
                value={formData.medicalInfo.physicalObservations}
                onChange={(e) =>
                  handleMedicalChange('physicalObservations', e.target.value)
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#F6F3F2] border border-[#E5E2E1] text-[#1C1B1B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#E5E2E1]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#B8B070] hover:bg-[#666028] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Guardar cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
