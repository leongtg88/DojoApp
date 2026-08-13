export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

export function validateAge(age: string): boolean {
  const trimmed = age.trim().toLowerCase();
  if (['adulto', '18+'].includes(trimmed)) return true;

  const num = Number(trimmed);
  return Number.isInteger(num) && num >= 3 && num <= 100;
}

export function validateWhatsApp(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+\d{8,15}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  if (!email.trim()) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
