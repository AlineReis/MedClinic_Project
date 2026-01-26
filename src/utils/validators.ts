import { USER_ROLES, type UserRole } from "@models/user.js";

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /[0-9]/,
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

export const getPasswordMissingRequirements = (password: string): string[] => {
  const missing: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    missing.push(`pelo menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
  }
  if (!PASSWORD_REQUIREMENTS.hasUpperCase.test(password)) {
    missing.push("uma letra maiúscula");
  }
  if (!PASSWORD_REQUIREMENTS.hasLowerCase.test(password)) {
    missing.push("uma letra minúscula");
  }
  if (!PASSWORD_REQUIREMENTS.hasNumber.test(password)) {
    missing.push("pelo menos um número");
  }

  return missing;
};

export function isValidCpfFormat(cpf: string): boolean {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}
export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}
export function isValidPhone(phone: string): boolean {
  return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(phone);
}

export function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}
