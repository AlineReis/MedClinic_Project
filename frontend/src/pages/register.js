/**
 * MedClinic Register Page
 */

import { auth } from '../services/api.js';
import { success, error } from '../utils/toast.js';
import {
  isValidEmail,
  isValidPassword,
  isValidCPF,
  isValidPhone,
  isValidName,
  formatCPF,
  formatPhone,
  unmaskCPF,
  unmaskPhone,
  applyMask,
} from '../utils/validators.js';
import { setButtonLoading } from '../utils/helpers.js';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const cpfInput = document.getElementById('cpf');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerBtn = document.getElementById('registerBtn');

// Error elements
const errors = {
  name: document.getElementById('nameError'),
  email: document.getElementById('emailError'),
  phone: document.getElementById('phoneError'),
  cpf: document.getElementById('cpfError'),
  password: document.getElementById('passwordError'),
  confirmPassword: document.getElementById('confirmPasswordError'),
};

/**
 * Initialize register page
 */
function init() {
  setupEventListeners();
  setupInputMasks();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  registerForm.addEventListener('submit', handleRegister);

  // Clear errors on input
  const inputs = [nameInput, emailInput, phoneInput, cpfInput, passwordInput, confirmPasswordInput];
  inputs.forEach((input) => {
    input.addEventListener('input', () => clearFieldError(input));
  });

  // Password confirmation validation
  confirmPasswordInput.addEventListener('blur', () => {
    if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
      showError(confirmPasswordInput, errors.confirmPassword, 'As senhas não coincidem');
    }
  });
}

/**
 * Setup input masks
 */
function setupInputMasks() {
  applyMask(cpfInput, formatCPF);
  applyMask(phoneInput, formatPhone);
}

/**
 * Handle register form submit
 */
async function handleRegister(e) {
  e.preventDefault();

  // Clear all errors
  clearAllErrors();

  // Get values
  const data = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: unmaskPhone(phoneInput.value),
    cpf: unmaskCPF(cpfInput.value),
    password: passwordInput.value,
    role: 'patient',
  };
  const confirmPassword = confirmPasswordInput.value;

  // Validate
  let isValid = true;

  if (!isValidName(data.name)) {
    showError(nameInput, errors.name, 'Nome deve ter no mínimo 2 caracteres');
    isValid = false;
  }

  if (!isValidEmail(data.email)) {
    showError(emailInput, errors.email, 'E-mail inválido');
    isValid = false;
  }

  if (data.phone && !isValidPhone(data.phone)) {
    showError(phoneInput, errors.phone, 'Telefone inválido');
    isValid = false;
  }

  if (!isValidCPF(data.cpf)) {
    showError(cpfInput, errors.cpf, 'CPF inválido');
    isValid = false;
  }

  if (!isValidPassword(data.password)) {
    showError(
      passwordInput,
      errors.password,
      'Senha deve ter 8+ caracteres, 1 maiúscula, 1 minúscula e 1 número'
    );
    isValid = false;
  }

  if (data.password !== confirmPassword) {
    showError(confirmPasswordInput, errors.confirmPassword, 'As senhas não coincidem');
    isValid = false;
  }

  if (!isValid) return;

  // Submit
  setButtonLoading(registerBtn, true);

  try {
    await auth.register(data);
    success('Conta criada com sucesso!', 'Redirecionando para login...');

    // Redirect to login after delay
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1500);
  } catch (err) {
    console.error('Register error:', err);

    if (err.code === 'EMAIL_ALREADY_EXISTS') {
      showError(emailInput, errors.email, 'Este e-mail já está cadastrado');
      error('E-mail já cadastrado');
    } else if (err.code === 'INVALID_INPUT' && err.field) {
      const fieldInput = document.getElementById(err.field);
      const fieldError = errors[err.field];
      if (fieldInput && fieldError) {
        showError(fieldInput, fieldError, err.message);
      }
      error(err.message);
    } else if (err.code === 'NETWORK_ERROR') {
      error('Erro de conexão', 'Verifique se o servidor está rodando');
    } else {
      error(err.message || 'Erro ao criar conta');
    }
  } finally {
    setButtonLoading(registerBtn, false);
  }
}

/**
 * Show field error
 */
function showError(input, errorEl, message) {
  input.classList.add('error');
  if (errorEl) errorEl.textContent = message;
}

/**
 * Clear single field error
 */
function clearFieldError(input) {
  input.classList.remove('error');
  const errorId = `${input.id}Error`;
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = '';
}

/**
 * Clear all errors
 */
function clearAllErrors() {
  Object.values(errors).forEach((el) => {
    if (el) el.textContent = '';
  });

  [nameInput, emailInput, phoneInput, cpfInput, passwordInput, confirmPasswordInput].forEach(
    (input) => input.classList.remove('error')
  );
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
