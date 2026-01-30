/**
 * MedClinic Form Validators
 * Client-side validation functions
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || password.length < 8) return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

/**
 * Get password validation errors
 * @param {string} password
 * @returns {string[]} Array of error messages
 */
export function getPasswordErrors(password) {
  const errors = [];

  if (!password) {
    errors.push('Senha é obrigatória');
    return errors;
  }

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Uma letra minúscula');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Uma letra maiúscula');
  }
  if (!/\d/.test(password)) {
    errors.push('Um número');
  }

  return errors;
}

/**
 * Validate CPF (Brazilian ID)
 * @param {string} cpf
 * @returns {boolean}
 */
export function isValidCPF(cpf) {
  if (!cpf) return false;

  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, '');

  // Must have 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validate check digits
  let sum = 0;
  let remainder;

  // First check digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  // Second check digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

/**
 * Validate phone number (Brazilian format)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone) return true; // Phone is optional

  // Remove non-digits
  const cleanPhone = phone.replace(/\D/g, '');

  // Must have 10 or 11 digits
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;

  // DDD must be valid (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  return true;
}

/**
 * Validate name
 * @param {string} name
 * @returns {boolean}
 */
export function isValidName(name) {
  if (!name) return false;
  return name.trim().length >= 2;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date
 * @returns {boolean}
 */
export function isValidDate(date) {
  if (!date) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;

  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Check if date is in the future
 * @param {string} date - YYYY-MM-DD format
 * @returns {boolean}
 */
export function isFutureDate(date) {
  if (!isValidDate(date)) return false;

  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return inputDate >= today;
}

/**
 * Check if date is within allowed range (max 90 days ahead)
 * @param {string} date
 * @returns {boolean}
 */
export function isWithinBookingRange(date) {
  if (!isFutureDate(date)) return false;

  const inputDate = new Date(date);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);

  return inputDate <= maxDate;
}

/**
 * Validate time format (HH:MM)
 * @param {string} time
 * @returns {boolean}
 */
export function isValidTime(time) {
  if (!time) return false;
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

/**
 * Format CPF with mask
 * @param {string} cpf
 * @returns {string}
 */
export function formatCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
}

/**
 * Format phone with mask
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length <= 2) return `(${cleanPhone}`;
  if (cleanPhone.length <= 7) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
  if (cleanPhone.length <= 10) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
}

/**
 * Remove CPF mask
 * @param {string} cpf
 * @returns {string}
 */
export function unmaskCPF(cpf) {
  return cpf.replace(/\D/g, '');
}

/**
 * Remove phone mask
 * @param {string} phone
 * @returns {string}
 */
export function unmaskPhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Validate form field and show error
 * @param {HTMLInputElement} input
 * @param {Function} validatorFn
 * @param {string} errorMessage
 * @returns {boolean}
 */
export function validateField(input, validatorFn, errorMessage) {
  const errorEl = document.getElementById(`${input.id}Error`);
  const isValid = validatorFn(input.value);

  if (!isValid) {
    input.classList.add('error');
    if (errorEl) errorEl.textContent = errorMessage;
  } else {
    input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  }

  return isValid;
}

/**
 * Clear all form errors
 * @param {HTMLFormElement} form
 */
export function clearFormErrors(form) {
  const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
  const errors = form.querySelectorAll('.form-error');

  inputs.forEach((input) => input.classList.remove('error'));
  errors.forEach((error) => (error.textContent = ''));
}

/**
 * Apply input mask on keyup
 * @param {HTMLInputElement} input
 * @param {Function} maskFn
 */
export function applyMask(input, maskFn) {
  input.addEventListener('input', (e) => {
    const cursorPos = e.target.selectionStart;
    const oldLength = e.target.value.length;
    e.target.value = maskFn(e.target.value);
    const newLength = e.target.value.length;
    const newCursorPos = cursorPos + (newLength - oldLength);
    e.target.setSelectionRange(newCursorPos, newCursorPos);
  });
}

export default {
  isValidEmail,
  isValidPassword,
  getPasswordErrors,
  isValidCPF,
  isValidPhone,
  isValidName,
  isValidDate,
  isFutureDate,
  isWithinBookingRange,
  isValidTime,
  formatCPF,
  formatPhone,
  unmaskCPF,
  unmaskPhone,
  validateField,
  clearFormErrors,
  applyMask,
};
