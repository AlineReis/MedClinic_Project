/**
 * MedClinic Auth Service
 * Manages authentication state and user session
 */

import { auth as authApi, ApiError } from './api.js';

// User state (in-memory cache)
let currentUser = null;

/**
 * Role labels in Portuguese
 */
const ROLE_LABELS = {
  patient: 'Paciente',
  receptionist: 'Recepcionista',
  lab_tech: 'Laboratório',
  health_professional: 'Profissional de Saúde',
  clinic_admin: 'Administrador',
  system_admin: 'Admin do Sistema',
};

/**
 * Get role label in Portuguese
 */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

/**
 * Check if user has one of the specified roles
 */
export function hasRole(user, roles) {
  if (!user || !user.role) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Get current logged-in user
 * @param {boolean} forceRefresh - Force fetch from API
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser(forceRefresh = false) {
  // Return cached user if available
  if (currentUser && !forceRefresh) {
    return currentUser;
  }

  try {
    const response = await authApi.getProfile();
    currentUser = response.user;
    return currentUser;
  } catch (error) {
    currentUser = null;
    return null;
  }
}

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User object
 */
export async function login(email, password) {
  const response = await authApi.login(email, password);
  currentUser = response.user;
  return currentUser;
}

/**
 * Register new user (patient only)
 * @param {Object} userData
 * @returns {Promise<Object>} User object
 */
export async function register(userData) {
  const response = await authApi.register({
    ...userData,
    role: 'patient', // Only patients can self-register
  });
  return response.user;
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await authApi.logout();
  } catch (error) {
    // Ignore logout errors
  }
  currentUser = null;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Require authentication - redirects to login if not authenticated
 * @returns {Promise<Object>} User object
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    // Redirect to login
    window.location.href = '../index.html';
    throw new Error('Not authenticated');
  }

  return user;
}

/**
 * Require specific roles - redirects if user doesn't have required role
 * @param {string|string[]} roles - Required roles
 * @returns {Promise<Object>} User object
 */
export async function requireRole(roles) {
  const user = await requireAuth();

  if (!hasRole(user, roles)) {
    // Redirect to dashboard (user doesn't have permission)
    window.location.href = 'dashboard.html';
    throw new Error('Insufficient permissions');
  }

  return user;
}

/**
 * Get user initials for avatar
 * @param {Object} user
 * @returns {string}
 */
export function getUserInitials(user) {
  if (!user || !user.name) return '?';

  const names = user.name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get user display name (first name only)
 * @param {Object} user
 * @returns {string}
 */
export function getUserFirstName(user) {
  if (!user || !user.name) return 'Usuário';
  return user.name.split(' ')[0];
}

/**
 * Format specialty name
 * @param {string} specialty
 * @returns {string}
 */
export function formatSpecialty(specialty) {
  const specialties = {
    psicologia: 'Psicologia',
    nutricao: 'Nutrição',
    fonoaudiologia: 'Fonoaudiologia',
    fisioterapia: 'Fisioterapia',
    clinica_medica: 'Clínica Médica',
    cardiologia: 'Cardiologia',
    oftalmologia: 'Oftalmologia',
    urologia: 'Urologia',
    cirurgia_geral: 'Cirurgia Geral',
    ortopedia: 'Ortopedia',
    neurologia: 'Neurologia',
  };

  return specialties[specialty] || specialty;
}

/**
 * Clear cached user data
 */
export function clearUserCache() {
  currentUser = null;
}

export default {
  getCurrentUser,
  login,
  register,
  logout,
  isAuthenticated,
  requireAuth,
  requireRole,
  hasRole,
  getRoleLabel,
  getUserInitials,
  getUserFirstName,
  formatSpecialty,
  clearUserCache,
};
