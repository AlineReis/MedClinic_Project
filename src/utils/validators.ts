import { USER_ROLES, type UserRole } from "../models/user.js";

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

export function isValidCpfLogic(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, "");
  if (cleanCPF.length !== 11) return false;

  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

export const isMinimumHoursInFuture = (
  target: Date,
  minHours: number,
  now: Date = new Date(),
): boolean => {
  const minMilliseconds = minHours * 60 * 60 * 1000;
  const diff = target.getTime() - now.getTime();

  return diff >= minMilliseconds;
};

export const isWithinMinimumHours = (
  date: string,
  time: string,
  minHours: number,
  now: Date = new Date(),
): boolean => {
  const appointment = new Date(`${date}T${time}:00`);

  if (isNaN(appointment.getTime())) return false;

  return isMinimumHoursInFuture(appointment, minHours, now);
};

export const isValidDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

export const isValidTime = (time: string): boolean => {
  const isFormatValid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
  if (!isFormatValid) return false;

  const [hours, minutes] = time.split(":").map(Number);
  if (hours < 8 || hours >= 18) {
    return false;
  }

  return true;
};

export const isWithinDayRange = (
  dateStr: string,
  maxDays: number,
  now: Date = new Date(),
): boolean => {
  const targetDate = new Date(`${dateStr}T00:00:00Z`);

  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const limitDateUTC = new Date(todayUTC);
  limitDateUTC.setUTCDate(todayUTC.getUTCDate() + maxDays);

  return targetDate >= todayUTC && targetDate <= limitDateUTC;
};

export const isValidId = (id: any): boolean => {
  const num = Number(id);
  return Number.isFinite(num) && num > 0;
};
