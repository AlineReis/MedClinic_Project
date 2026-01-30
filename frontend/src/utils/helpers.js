/**
 * MedClinic Helper Functions
 * General utility functions
 */

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date with day name
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateLong(date) {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format time (HH:MM)
 * @param {string} time
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return '-';
  return time.slice(0, 5);
}

/**
 * Format currency to Brazilian Real
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format number with thousand separators
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current date formatted (Terça-feira, 24 de Janeiro)
 * @returns {string}
 */
export function getTodayFormatted() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Get date N days from now in YYYY-MM-DD format
 * @param {number} days
 * @returns {string}
 */
export function getDateFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate difference in hours between now and a datetime
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @returns {number}
 */
export function hoursUntil(date, time) {
  const appointmentDate = new Date(`${date}T${time}:00`);
  const now = new Date();
  const diffMs = appointmentDate - now;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Get appointment status label in Portuguese
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  const labels = {
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    waiting: 'Em Espera',
    in_progress: 'Em Atendimento',
    completed: 'Realizada',
    no_show: 'Não Compareceu',
    cancelled_by_patient: 'Cancelada pelo Paciente',
    cancelled_by_clinic: 'Cancelada pela Clínica',
    rescheduled: 'Reagendada',
  };
  return labels[status] || status;
}

/**
 * Get status badge class
 * @param {string} status
 * @returns {string}
 */
export function getStatusClass(status) {
  const classes = {
    scheduled: 'badge-info',
    confirmed: 'badge-success',
    waiting: 'badge-warning',
    in_progress: 'badge-info',
    completed: 'badge-success',
    no_show: 'badge-error',
    cancelled_by_patient: 'badge-error',
    cancelled_by_clinic: 'badge-error',
    rescheduled: 'badge-warning',
  };
  return classes[status] || 'badge-neutral';
}

/**
 * Get payment status label
 * @param {string} status
 * @returns {string}
 */
export function getPaymentStatusLabel(status) {
  const labels = {
    pending: 'Pendente',
    processing: 'Processando',
    paid: 'Pago',
    failed: 'Falhou',
    refunded: 'Reembolsado',
    partially_refunded: 'Reembolso Parcial',
  };
  return labels[status] || status;
}

/**
 * Get exam status label
 * @param {string} status
 * @returns {string}
 */
export function getExamStatusLabel(status) {
  const labels = {
    pending_payment: 'Aguardando Pagamento',
    paid_pending_schedule: 'Aguardando Agendamento',
    scheduled: 'Agendado',
    in_analysis: 'Em Análise',
    ready: 'Resultado Pronto',
    released: 'Resultado Liberado',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Create element with attributes
 * @param {string} tag
 * @param {Object} attrs
 * @param {string|HTMLElement|HTMLElement[]} children
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = null) {
  const element = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });

  if (children) {
    if (typeof children === 'string') {
      element.innerHTML = children;
    } else if (Array.isArray(children)) {
      children.forEach((child) => element.appendChild(child));
    } else {
      element.appendChild(children);
    }
  }

  return element;
}

/**
 * Show loading state on button
 * @param {HTMLButtonElement} button
 * @param {boolean} loading
 */
export function setButtonLoading(button, loading) {
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.loading-spinner');

  button.disabled = loading;

  if (text) text.style.display = loading ? 'none' : 'inline';
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
}

/**
 * Show skeleton loading in container
 * @param {HTMLElement} container
 * @param {number} count
 */
export function showSkeletonLoading(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = createElement('div', { className: 'skeleton skeleton-card' });
    skeleton.style.height = '80px';
    skeleton.style.marginBottom = '8px';
    container.appendChild(skeleton);
  }
}

/**
 * Hide element
 * @param {HTMLElement|string} element
 */
export function hide(element) {
  const el = typeof element === 'string' ? document.getElementById(element) : element;
  if (el) el.style.display = 'none';
}

/**
 * Show element
 * @param {HTMLElement|string} element
 * @param {string} display
 */
export function show(element, display = 'block') {
  const el = typeof element === 'string' ? document.getElementById(element) : element;
  if (el) el.style.display = display;
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element
 */
export function toggle(element) {
  const el = typeof element === 'string' ? document.getElementById(element) : element;
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

/**
 * Get query parameter from URL
 * @param {string} name
 * @returns {string|null}
 */
export function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Set query parameter in URL without reload
 * @param {string} name
 * @param {string} value
 */
export function setQueryParam(name, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }
  window.history.replaceState({}, '', url);
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export default {
  formatDate,
  formatDateLong,
  formatTime,
  formatCurrency,
  formatNumber,
  getTodayISO,
  getTodayFormatted,
  getDateFromNow,
  hoursUntil,
  getStatusLabel,
  getStatusClass,
  getPaymentStatusLabel,
  getExamStatusLabel,
  debounce,
  throttle,
  createElement,
  setButtonLoading,
  showSkeletonLoading,
  hide,
  show,
  toggle,
  getQueryParam,
  setQueryParam,
  capitalize,
  truncate,
};
