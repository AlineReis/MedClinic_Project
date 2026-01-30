/**
 * MedClinic Appointments Page
 */

import { appointments, professionals } from '../services/api.js';
import {
  requireAuth,
  hasRole,
  getRoleLabel,
  getUserInitials,
  formatSpecialty,
  logout as authLogout,
} from '../services/auth.js';
import { success, error, warning } from '../utils/toast.js';
import {
  formatDate,
  formatTime,
  formatCurrency,
  getTodayFormatted,
  getTodayISO,
  getDateFromNow,
  getStatusLabel,
  getStatusClass,
  getPaymentStatusLabel,
  showSkeletonLoading,
  debounce,
} from '../utils/helpers.js';

let currentUser = null;
let currentPage = 1;
let totalPages = 1;
let selectedAppointmentId = null;
let selectedAppointment = null;

// DOM Elements
const filterStatus = document.getElementById('filterStatus');
const filterDate = document.getElementById('filterDate');
const filterSearch = document.getElementById('filterSearch');
const appointmentsTableBody = document.getElementById('appointmentsTableBody');
const totalCount = document.getElementById('totalCount');
const pagination = document.getElementById('pagination');

/**
 * Initialize page
 */
async function init() {
  try {
    currentUser = await requireAuth();
    setupUI();
    setupEventListeners();
    await loadAppointments();
  } catch (err) {
    console.error('Init error:', err);
  }
}

/**
 * Setup UI based on role
 */
function setupUI() {
  // User info
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = getRoleLabel(currentUser.role);

  const avatar = document.getElementById('userAvatar');
  avatar.textContent = getUserInitials(currentUser);
  avatar.style.cssText = 'background-color: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: bold; font-size: 14px;';

  document.getElementById('currentDate').textContent = getTodayFormatted();

  // Setup navigation visibility
  const navLinks = document.querySelectorAll('.nav-link[data-roles]');
  navLinks.forEach(link => {
    const roles = link.dataset.roles.split(',');
    if (!hasRole(currentUser, roles)) {
      link.style.display = 'none';
    }
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mobileSidebarBackdrop').classList.add('active');
    const mobileSidebar = document.getElementById('mobileSidebar');
    if (!mobileSidebar.innerHTML.trim()) {
      mobileSidebar.innerHTML = document.getElementById('sidebar').innerHTML;
    }
    mobileSidebar.classList.add('active');
  });

  document.getElementById('mobileSidebarBackdrop').addEventListener('click', () => {
    document.getElementById('mobileSidebarBackdrop').classList.remove('active');
    document.getElementById('mobileSidebar').classList.remove('active');
  });

  // Filters
  document.getElementById('applyFilters').addEventListener('click', () => {
    currentPage = 1;
    loadAppointments();
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    filterStatus.value = '';
    filterDate.value = '';
    filterSearch.value = '';
    currentPage = 1;
    loadAppointments();
  });

  filterSearch.addEventListener('input', debounce(() => {
    currentPage = 1;
    loadAppointments();
  }, 500));

  // New appointment
  document.getElementById('newAppointmentBtn').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  // Cancel modal
  document.getElementById('closeCancelModal').addEventListener('click', closeCancelModal);
  document.getElementById('cancelCancelBtn').addEventListener('click', closeCancelModal);
  document.getElementById('confirmCancelBtn').addEventListener('click', handleCancelAppointment);
  document.getElementById('cancelModal').addEventListener('click', (e) => {
    if (e.target.id === 'cancelModal') closeCancelModal();
  });

  // Reschedule modal
  document.getElementById('closeRescheduleModal').addEventListener('click', closeRescheduleModal);
  document.getElementById('cancelRescheduleBtn').addEventListener('click', closeRescheduleModal);
  document.getElementById('confirmRescheduleBtn').addEventListener('click', handleReschedule);
  document.getElementById('rescheduleModal').addEventListener('click', (e) => {
    if (e.target.id === 'rescheduleModal') closeRescheduleModal();
  });

  const newDateInput = document.getElementById('newDate');
  newDateInput.min = getTodayISO();
  newDateInput.max = getDateFromNow(90);
  newDateInput.addEventListener('change', loadRescheduleSlots);
}

/**
 * Load appointments with filters
 */
async function loadAppointments() {
  const params = {
    page: currentPage,
    pageSize: 10,
  };

  if (filterStatus.value) params.status = filterStatus.value;
  if (filterDate.value) params.date = filterDate.value;
  if (filterSearch.value) params.search = filterSearch.value;

  try {
    appointmentsTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px;">
        <span class="loading-spinner"></span>
      </td></tr>
    `;

    const response = await appointments.list(params);
    // Backend retorna: { success, data: [...], page, pageSize, total, totalPages }
    const data = response.data || [];
    const paginationData = {
      page: response.page || 1,
      pageSize: response.pageSize || 10,
      total: response.total || 0,
      totalPages: response.totalPages || 1
    };

    totalPages = paginationData.totalPages;
    totalCount.textContent = `${paginationData.total} agendamentos`;

    renderAppointments(data);
    renderPagination(paginationData);
  } catch (err) {
    console.error('Error loading appointments:', err);
    appointmentsTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-error);">
        Erro ao carregar agendamentos
      </td></tr>
    `;
    error('Erro ao carregar agendamentos');
  }
}

/**
 * Render appointments table
 */
function renderAppointments(data) {
  if (data.length === 0) {
    appointmentsTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
        <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 8px;">event_busy</span>
        Nenhum agendamento encontrado
      </td></tr>
    `;
    return;
  }

  appointmentsTableBody.innerHTML = data.map(apt => `
    <tr data-id="${apt.id}">
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">
            ${getUserInitials(apt.patient)}
          </div>
          <div>
            <div style="font-weight: 600;">${apt.patient?.name || '-'}</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">${apt.patient?.phone || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight: 500;">${apt.professional?.name || '-'}</div>
        <div style="font-size: 12px; color: var(--color-text-muted);">${formatSpecialty(apt.professional?.specialty)}</div>
      </td>
      <td>
        <div>${formatDate(apt.date)}</div>
        <div style="font-size: 12px; color: var(--color-text-muted);">${formatTime(apt.time)}</div>
      </td>
      <td>
        <span class="badge ${apt.type === 'online' ? 'badge-info' : 'badge-neutral'}">
          ${apt.type === 'online' ? 'Online' : 'Presencial'}
        </span>
      </td>
      <td>
        <span class="badge ${getStatusClass(apt.status)}">
          ${getStatusLabel(apt.status)}
        </span>
      </td>
      <td>
        <span class="badge ${apt.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}">
          ${getPaymentStatusLabel(apt.payment_status)}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 4px;">
          ${renderActions(apt)}
        </div>
      </td>
    </tr>
  `).join('');

  // Add event listeners to action buttons
  document.querySelectorAll('.action-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => openCancelModal(e.target.closest('button').dataset.id));
  });

  document.querySelectorAll('.action-reschedule').forEach(btn => {
    btn.addEventListener('click', (e) => openRescheduleModal(e.target.closest('button').dataset.id));
  });

  document.querySelectorAll('.action-checkin').forEach(btn => {
    btn.addEventListener('click', (e) => handleCheckIn(e.target.closest('button').dataset.id));
  });

  document.querySelectorAll('.action-start').forEach(btn => {
    btn.addEventListener('click', (e) => handleStart(e.target.closest('button').dataset.id));
  });

  document.querySelectorAll('.action-complete').forEach(btn => {
    btn.addEventListener('click', (e) => handleComplete(e.target.closest('button').dataset.id));
  });
}

/**
 * Render action buttons based on appointment status and user role
 */
function renderActions(apt) {
  const actions = [];
  const canModify = ['scheduled', 'confirmed'].includes(apt.status);
  const isOwnAppointment = currentUser.role === 'patient' && apt.patient?.id === currentUser.id;
  const isReceptionist = hasRole(currentUser, ['receptionist', 'clinic_admin']);
  const isProfessional = hasRole(currentUser, ['health_professional']) && apt.professional?.id === currentUser.id;

  if (canModify && (isOwnAppointment || isReceptionist)) {
    actions.push(`
      <button class="btn btn-sm btn-ghost action-reschedule" data-id="${apt.id}" title="Reagendar">
        <span class="material-symbols-outlined" style="font-size: 18px;">event</span>
      </button>
    `);
    actions.push(`
      <button class="btn btn-sm btn-ghost action-cancel" data-id="${apt.id}" title="Cancelar" style="color: var(--color-error);">
        <span class="material-symbols-outlined" style="font-size: 18px;">cancel</span>
      </button>
    `);
  }

  if (apt.status === 'confirmed' && isReceptionist) {
    actions.push(`
      <button class="btn btn-sm btn-primary action-checkin" data-id="${apt.id}" title="Check-in">
        <span class="material-symbols-outlined" style="font-size: 18px;">how_to_reg</span>
      </button>
    `);
  }

  if (apt.status === 'waiting' && isProfessional) {
    actions.push(`
      <button class="btn btn-sm btn-primary action-start" data-id="${apt.id}" title="Iniciar">
        <span class="material-symbols-outlined" style="font-size: 18px;">play_arrow</span>
      </button>
    `);
  }

  if (apt.status === 'in_progress' && isProfessional) {
    actions.push(`
      <button class="btn btn-sm btn-success action-complete" data-id="${apt.id}" title="Finalizar">
        <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
      </button>
    `);
  }

  return actions.length > 0 ? actions.join('') : '<span style="color: var(--color-text-muted);">-</span>';
}

/**
 * Render pagination
 */
function renderPagination(paginationData) {
  const { page, totalPages } = paginationData;
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
    <span class="material-symbols-outlined">chevron_left</span>
  </button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === page) {
      html += `<button class="pagination-btn active">${i}</button>`;
    } else if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="color: var(--color-text-muted);">...</span>`;
    }
  }

  // Next button
  html += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">
    <span class="material-symbols-outlined">chevron_right</span>
  </button>`;

  pagination.innerHTML = html;

  // Add event listeners
  pagination.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      loadAppointments();
    });
  });
}

/**
 * Open cancel modal
 */
function openCancelModal(id) {
  selectedAppointmentId = id;
  document.getElementById('cancelReason').value = '';
  document.getElementById('cancelModal').classList.add('active');
}

/**
 * Close cancel modal
 */
function closeCancelModal() {
  selectedAppointmentId = null;
  document.getElementById('cancelModal').classList.remove('active');
}

/**
 * Handle cancel appointment
 */
async function handleCancelAppointment() {
  if (!selectedAppointmentId) return;

  const reason = document.getElementById('cancelReason').value;
  const btn = document.getElementById('confirmCancelBtn');

  try {
    btn.disabled = true;
    btn.textContent = 'Cancelando...';

    const response = await appointments.cancel(selectedAppointmentId, reason);

    success('Agendamento cancelado com sucesso');

    if (response.refund) {
      const refundMsg = `Reembolso: ${formatCurrency(response.refund.amount)} (${response.refund.percentage}%)`;
      warning(refundMsg, 'Informação de Reembolso');
    }

    closeCancelModal();
    await loadAppointments();
  } catch (err) {
    console.error('Cancel error:', err);
    error(err.message || 'Erro ao cancelar agendamento');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar Cancelamento';
  }
}

/**
 * Open reschedule modal
 */
async function openRescheduleModal(id) {
  selectedAppointmentId = id;

  // Get appointment details to get professional ID
  try {
    const response = await appointments.getById(id);
    selectedAppointment = response.appointment;
    document.getElementById('newDate').value = '';
    document.getElementById('newTime').innerHTML = '<option value="">Selecione a data primeiro</option>';
    document.getElementById('newTime').disabled = true;
    document.getElementById('rescheduleModal').classList.add('active');
  } catch (err) {
    error('Erro ao carregar dados do agendamento');
  }
}

/**
 * Close reschedule modal
 */
function closeRescheduleModal() {
  selectedAppointmentId = null;
  selectedAppointment = null;
  document.getElementById('rescheduleModal').classList.remove('active');
}

/**
 * Load available slots for reschedule
 */
async function loadRescheduleSlots() {
  const date = document.getElementById('newDate').value;
  const timeSelect = document.getElementById('newTime');

  if (!date || !selectedAppointment) return;

  try {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Carregando...</option>';

    const response = await professionals.getAvailability(selectedAppointment.professional.id, {
      startDate: date,
      endDate: date,
    });

    const dayData = (response.data || []).find(d => d.date === date);
    const availableSlots = dayData?.slots?.filter(s => s.available) || [];

    if (availableSlots.length === 0) {
      timeSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
      return;
    }

    timeSelect.innerHTML = '<option value="">Selecione o horário</option>' +
      availableSlots.map(s => `<option value="${s.time}">${s.time}</option>`).join('');
    timeSelect.disabled = false;
  } catch (err) {
    console.error('Error loading slots:', err);
    timeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

/**
 * Handle reschedule
 */
async function handleReschedule() {
  if (!selectedAppointmentId) return;

  const newDate = document.getElementById('newDate').value;
  const newTime = document.getElementById('newTime').value;

  if (!newDate || !newTime) {
    error('Selecione data e horário');
    return;
  }

  const btn = document.getElementById('confirmRescheduleBtn');

  try {
    btn.disabled = true;
    btn.textContent = 'Reagendando...';

    await appointments.reschedule(selectedAppointmentId, newDate, newTime);

    success('Agendamento reagendado com sucesso');
    closeRescheduleModal();
    await loadAppointments();
  } catch (err) {
    console.error('Reschedule error:', err);
    error(err.message || 'Erro ao reagendar');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reagendar';
  }
}

/**
 * Handle check-in
 */
async function handleCheckIn(id) {
  try {
    await appointments.checkIn(id);
    success('Check-in realizado');
    await loadAppointments();
  } catch (err) {
    error(err.message || 'Erro ao fazer check-in');
  }
}

/**
 * Handle start appointment
 */
async function handleStart(id) {
  try {
    await appointments.start(id);
    success('Atendimento iniciado');
    await loadAppointments();
  } catch (err) {
    error(err.message || 'Erro ao iniciar atendimento');
  }
}

/**
 * Handle complete appointment
 */
async function handleComplete(id) {
  try {
    await appointments.complete(id);
    success('Atendimento finalizado');
    await loadAppointments();
  } catch (err) {
    error(err.message || 'Erro ao finalizar atendimento');
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  await authLogout();
  window.location.href = '../index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
