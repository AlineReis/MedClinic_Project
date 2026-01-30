/**
 * MedClinic Toast Notification System
 * Displays toast messages for user feedback
 */

const TOAST_DURATION = 5000; // 5 seconds
const MAX_TOASTS = 3;

let toastContainer = null;
let toastCount = 0;

/**
 * Initialize toast container
 */
function initToastContainer() {
  if (toastContainer) return toastContainer;

  toastContainer = document.getElementById('toastContainer');

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  return toastContainer;
}

/**
 * Get icon for toast type
 */
function getToastIcon(type) {
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  return icons[type] || 'info';
}

/**
 * Create and show a toast notification
 * @param {Object} options - Toast options
 * @param {string} options.type - Toast type: success, error, warning, info
 * @param {string} options.title - Toast title
 * @param {string} options.message - Toast message
 * @param {number} options.duration - Duration in ms (optional)
 */
export function showToast({ type = 'info', title, message, duration = TOAST_DURATION }) {
  const container = initToastContainer();

  // Limit number of toasts
  const existingToasts = container.querySelectorAll('.toast');
  if (existingToasts.length >= MAX_TOASTS) {
    existingToasts[0].remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = `toast-${++toastCount}`;

  toast.innerHTML = `
    <span class="material-symbols-outlined toast-icon ${type}">${getToastIcon(type)}</span>
    <div class="toast-content">
      ${title ? `<p class="toast-title">${title}</p>` : ''}
      ${message ? `<p class="toast-message">${message}</p>` : ''}
    </div>
    <button class="toast-close" aria-label="Fechar">
      <span class="material-symbols-outlined">close</span>
    </button>
  `;

  // Add close handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  // Add to container
  container.appendChild(toast);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

/**
 * Remove toast with animation
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;

  toast.style.animation = 'slideOut 0.3s ease forwards';
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 300);
}

/**
 * Show success toast
 */
export function success(message, title = 'Sucesso') {
  return showToast({ type: 'success', title, message });
}

/**
 * Show error toast
 */
export function error(message, title = 'Erro') {
  return showToast({ type: 'error', title, message });
}

/**
 * Show warning toast
 */
export function warning(message, title = 'Atenção') {
  return showToast({ type: 'warning', title, message });
}

/**
 * Show info toast
 */
export function info(message, title = 'Informação') {
  return showToast({ type: 'info', title, message });
}

/**
 * Clear all toasts
 */
export function clearAll() {
  const container = initToastContainer();
  container.innerHTML = '';
}

// Add slide out animation to document
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

export default {
  showToast,
  success,
  error,
  warning,
  info,
  clearAll,
};
