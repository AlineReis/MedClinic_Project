/**
 * MedClinic Login Page
 */

import { auth } from '../services/api.js';
import { getCurrentUser } from '../services/auth.js';
import { success, error } from '../utils/toast.js';
import { isValidEmail } from '../utils/validators.js';
import { setButtonLoading } from '../utils/helpers.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

/**
 * Initialize login page
 */
async function init() {
  // Check if already logged in
  const user = await getCurrentUser();
  if (user) {
    redirectToDashboard();
    return;
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Form submit
  loginForm.addEventListener('submit', handleLogin);

  // Demo login buttons
  document.querySelectorAll('.demo-login-btn').forEach((btn) => {
    btn.addEventListener('click', handleDemoLogin);
  });

  // Clear errors on input
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    emailError.textContent = '';
  });

  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    passwordError.textContent = '';
  });
}

/**
 * Handle login form submit
 */
async function handleLogin(e) {
  e.preventDefault();

  // Reset errors
  clearErrors();

  // Validate
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;

  if (!email) {
    showError(emailInput, emailError, 'E-mail é obrigatório');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError(emailInput, emailError, 'E-mail inválido');
    isValid = false;
  }

  if (!password) {
    showError(passwordInput, passwordError, 'Senha é obrigatória');
    isValid = false;
  }

  if (!isValid) return;

  // Submit
  setButtonLoading(loginBtn, true);

  try {
    const response = await auth.login(email, password);
    success('Login realizado com sucesso!');

    // Small delay to show success message
    setTimeout(() => {
      redirectToDashboard();
    }, 500);
  } catch (err) {
    console.error('Login error:', err);

    if (err.code === 'INVALID_CREDENTIALS') {
      error('E-mail ou senha inválidos');
      showError(emailInput, emailError, '');
      showError(passwordInput, passwordError, 'Verifique suas credenciais');
    } else if (err.code === 'NETWORK_ERROR') {
      error('Erro de conexão', 'Verifique se o servidor está rodando');
    } else {
      error(err.message || 'Erro ao fazer login');
    }
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

/**
 * Handle demo login button click
 */
async function handleDemoLogin(e) {
  const email = e.target.dataset.email;
  const password = e.target.dataset.password;

  if (!email || !password) return;

  // Fill form
  emailInput.value = email;
  passwordInput.value = password;

  // Clear any errors
  clearErrors();

  // Submit form
  loginForm.dispatchEvent(new Event('submit'));
}

/**
 * Show field error
 */
function showError(input, errorEl, message) {
  input.classList.add('error');
  if (errorEl && message) errorEl.textContent = message;
}

/**
 * Clear all errors
 */
function clearErrors() {
  emailInput.classList.remove('error');
  passwordInput.classList.remove('error');
  emailError.textContent = '';
  passwordError.textContent = '';
}

/**
 * Redirect to dashboard
 */
function redirectToDashboard() {
  window.location.href = 'pages/dashboard.html';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
