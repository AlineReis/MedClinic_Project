/**
 * MedClinic Dashboard Page
 * Main dashboard with role-based content
 */

import { appointments, professionals } from '../services/api.js';
import {
  requireAuth,
  hasRole,
  getRoleLabel,
  getUserInitials,
  getUserFirstName,
  formatSpecialty,
  logout as authLogout,
} from '../services/auth.js';
import { success, error, info } from '../utils/toast.js';
import {
  formatDate,
  formatTime,
  formatCurrency,
  getTodayFormatted,
  getTodayISO,
  getDateFromNow,
  getStatusLabel,
  showSkeletonLoading,
  createElement,
  debounce,
} from '../utils/helpers.js';

// Current user
let currentUser = null;

// DOM Elements
const pageTitle = document.getElementById('pageTitle');
const currentDate = document.getElementById('currentDate');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const userAvatar = document.getElementById('userAvatar');
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeText = document.getElementById('welcomeText');
const metricsGrid = document.getElementById('metricsGrid');
const barChart = document.getElementById('barChart');
const appointmentsList = document.getElementById('appointmentsList');
const navMenu = document.getElementById('navMenu');

// Modal elements
const appointmentModal = document.getElementById('appointmentModal');
const closeAppointmentModal = document.getElementById('closeAppointmentModal');
const cancelAppointment = document.getElementById('cancelAppointment');
const appointmentForm = document.getElementById('appointmentForm');
const specialtySelect = document.getElementById('specialty');
const professionalSelect = document.getElementById('professional');
const dateInput = document.getElementById('appointmentDate');
const timeSelect = document.getElementById('appointmentTime');
const patientSelectGroup = document.getElementById('patientSelectGroup');

/**
 * Initialize dashboard
 */
async function init() {
  try {
    // Require authentication
    currentUser = await requireAuth();

    // Setup UI
    setupUserInfo();
    setupNavigation();
    setupEventListeners();
    setCurrentDate();

    // Load data
    await loadDashboardData();
  } catch (err) {
    console.error('Dashboard init error:', err);
  }
}

/**
 * Setup user info in sidebar
 */
function setupUserInfo() {
  userName.textContent = currentUser.name;
  userRole.textContent = getRoleLabel(currentUser.role);

  // Set avatar with initials
  const initials = getUserInitials(currentUser);
  userAvatar.style.backgroundColor = 'var(--color-primary-light)';
  userAvatar.style.display = 'flex';
  userAvatar.style.alignItems = 'center';
  userAvatar.style.justifyContent = 'center';
  userAvatar.style.color = 'var(--color-primary)';
  userAvatar.style.fontWeight = 'bold';
  userAvatar.style.fontSize = '14px';
  userAvatar.textContent = initials;

  // Welcome message
  welcomeTitle.textContent = `Bem-vindo, ${getUserFirstName(currentUser)}!`;
  updateWelcomeText();
}

/**
 * Update welcome text based on role
 */
function updateWelcomeText() {
  const role = currentUser.role;

  if (role === 'patient') {
    welcomeText.innerHTML = `
      Gerencie suas consultas, exames e prescrições em um só lugar.
      <span class="hero-highlight">Agende agora</span> sua próxima consulta.
    `;
  } else if (role === 'health_professional') {
    welcomeText.innerHTML = `
      Confira sua agenda do dia e gerencie seus atendimentos.
      Você pode criar <span class="hero-highlight">prescrições</span> e solicitar <span class="hero-highlight">exames</span>.
    `;
  } else if (role === 'receptionist') {
    welcomeText.innerHTML = `
      Gerencie os agendamentos da clínica e faça o check-in dos pacientes.
      <span class="hero-highlight">Organize</span> a agenda do dia.
    `;
  } else if (role === 'lab_tech') {
    welcomeText.innerHTML = `
      Visualize os exames pendentes e faça o upload dos resultados.
      <span class="hero-highlight">Libere</span> os laudos para os pacientes.
    `;
  } else {
    welcomeText.innerHTML = `
      Painel administrativo completo. Gerencie usuários, profissionais e acompanhe o
      <span class="hero-highlight">desempenho financeiro</span> da clínica.
    `;
  }
}

/**
 * Setup navigation based on user role
 */
function setupNavigation() {
  const navLinks = navMenu.querySelectorAll('.nav-link[data-roles]');

  navLinks.forEach((link) => {
    const allowedRoles = link.dataset.roles.split(',');
    if (!hasRole(currentUser, allowedRoles)) {
      link.style.display = 'none';
    }
  });

  // Show patient select for receptionist/admin when creating appointments
  if (hasRole(currentUser, ['receptionist', 'clinic_admin', 'system_admin'])) {
    patientSelectGroup.style.display = 'block';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', toggleMobileMenu);
  document.getElementById('mobileSidebarBackdrop').addEventListener('click', closeMobileMenu);

  // New appointment modal
  document.getElementById('newAppointmentBtn').addEventListener('click', openAppointmentModal);
  closeAppointmentModal.addEventListener('click', closeModal);
  cancelAppointment.addEventListener('click', closeModal);
  appointmentModal.addEventListener('click', (e) => {
    if (e.target === appointmentModal) closeModal();
  });

  // Appointment form
  specialtySelect.addEventListener('change', handleSpecialtyChange);
  professionalSelect.addEventListener('change', handleProfessionalChange);
  dateInput.addEventListener('change', handleDateChange);
  appointmentForm.addEventListener('submit', handleAppointmentSubmit);

  // Set min date for appointment
  dateInput.min = getTodayISO();
  dateInput.max = getDateFromNow(90);

  // Search
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(handleSearch, 500));

  // Chart period buttons
  document.querySelectorAll('.chart-btn').forEach((btn) => {
    btn.addEventListener('click', handleChartPeriodChange);
  });
}

/**
 * Set current date in header
 */
function setCurrentDate() {
  currentDate.textContent = getTodayFormatted();
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
  await Promise.all([loadMetrics(), loadChart(), loadAppointments()]);
}

/**
 * Load metrics based on role
 */
async function loadMetrics() {
  metricsGrid.innerHTML = '';

  try {
    // Get appointments for today
    const today = getTodayISO();
    const response = await appointments.list({ date: today });
    const todayAppointments = response.data || [];

    const metrics = getMetricsForRole(todayAppointments);

    metrics.forEach((metric) => {
      const card = createMetricCard(metric);
      metricsGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading metrics:', err);
    error('Erro ao carregar métricas');
  }
}

/**
 * Get metrics based on user role
 */
function getMetricsForRole(appointments) {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const pending = appointments.filter((a) =>
    ['scheduled', 'confirmed', 'waiting'].includes(a.status)
  ).length;

  if (currentUser.role === 'patient') {
    return [
      {
        icon: 'calendar_month',
        iconClass: 'blue',
        label: 'Minhas Consultas',
        value: total,
        badge: pending > 0 ? `${pending} pendentes` : null,
        badgeClass: 'success',
        progress: total > 0 ? (completed / total) * 100 : 0,
        progressClass: 'blue',
      },
      {
        icon: 'biotech',
        iconClass: 'purple',
        label: 'Exames Pendentes',
        value: 0,
        badge: null,
        progress: 0,
        progressClass: 'purple',
      },
      {
        icon: 'medication',
        iconClass: 'green',
        label: 'Prescrições Ativas',
        value: 0,
        badge: null,
        progress: 0,
        progressClass: 'green',
      },
    ];
  }

  if (currentUser.role === 'health_professional') {
    const waiting = appointments.filter((a) => a.status === 'waiting').length;
    return [
      {
        icon: 'stethoscope',
        iconClass: 'blue',
        label: 'Consultas Hoje',
        value: total,
        badge: waiting > 0 ? `${waiting} em espera` : null,
        badgeClass: 'success',
        progress: total > 0 ? (completed / total) * 100 : 0,
        progressClass: 'blue',
      },
      {
        icon: 'check_circle',
        iconClass: 'green',
        label: 'Realizadas',
        value: completed,
        badge: null,
        progress: 100,
        progressClass: 'green',
      },
      {
        icon: 'payments',
        iconClass: 'purple',
        label: 'Comissão Prevista',
        value: formatCurrency(completed * 120), // Example calculation
        badge: null,
        progress: 60,
        progressClass: 'purple',
      },
    ];
  }

  // Admin/Receptionist metrics
  return [
    {
      icon: 'stethoscope',
      iconClass: 'blue',
      label: 'Consultas Hoje',
      value: total,
      badge: '+12%',
      badgeClass: 'success',
      progress: 75,
      progressClass: 'blue',
    },
    {
      icon: 'attach_money',
      iconClass: 'purple',
      label: 'Faturamento Estimado',
      value: formatCurrency(total * 250),
      badge: '92% da meta',
      badgeClass: 'neutral',
      progress: 92,
      progressClass: 'purple',
    },
    {
      icon: 'person_add',
      iconClass: 'orange',
      label: 'Novos Pacientes',
      value: 3,
      badge: '+5%',
      badgeClass: 'success',
      progress: 45,
      progressClass: 'orange',
    },
  ];
}

/**
 * Create metric card element
 */
function createMetricCard(metric) {
  const card = createElement('div', { className: 'card metric-card' });

  card.innerHTML = `
    <div class="metric-header">
      <div class="metric-icon ${metric.iconClass}">
        <span class="material-symbols-outlined">${metric.icon}</span>
      </div>
      ${
        metric.badge
          ? `<span class="metric-badge ${metric.badgeClass}">${metric.badge}</span>`
          : ''
      }
    </div>
    <div class="metric-body">
      <p class="metric-label">${metric.label}</p>
      <h3 class="metric-value">${metric.value}</h3>
    </div>
    <div class="metric-progress">
      <div class="metric-progress-bar ${metric.progressClass}" style="width: ${metric.progress}%"></div>
    </div>
  `;

  return card;
}

/**
 * Load chart data
 */
async function loadChart() {
  // Mock data for specialties chart
  const chartData = [
    { label: 'Psicologia', value: 85, color: 'blue' },
    { label: 'Cardiologia', value: 62, color: 'purple' },
    { label: 'Nutrição', value: 94, color: 'orange' },
    { label: 'Clínica Geral', value: 45, color: 'gray' },
    { label: 'Ortopedia', value: 72, color: 'teal' },
  ];

  renderBarChart(chartData);
}

/**
 * Render bar chart
 */
function renderBarChart(data) {
  barChart.innerHTML = '';

  data.forEach((item) => {
    const barItem = createElement('div', { className: 'bar-item' });

    barItem.innerHTML = `
      <div class="bar-wrapper">
        <div class="bar ${item.color}" style="height: ${item.value}%">
          <span class="bar-value">${item.value}%</span>
        </div>
      </div>
      <p class="bar-label">${item.label}</p>
    `;

    barChart.appendChild(barItem);
  });
}

/**
 * Load upcoming appointments
 */
async function loadAppointments() {
  showSkeletonLoading(appointmentsList, 4);

  try {
    const response = await appointments.list({
      upcoming: true,
      pageSize: 5,
    });

    const appointmentData = response.data || [];
    renderAppointments(appointmentData);
  } catch (err) {
    console.error('Error loading appointments:', err);
    appointmentsList.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <span class="material-symbols-outlined icon" style="font-size: 48px;">error</span>
        <p style="color: var(--color-text-muted); font-size: 14px;">Erro ao carregar agendamentos</p>
      </div>
    `;
  }
}

/**
 * Render appointments list
 */
function renderAppointments(appointmentData) {
  appointmentsList.innerHTML = '';

  if (appointmentData.length === 0) {
    appointmentsList.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <span class="material-symbols-outlined icon" style="font-size: 48px;">event_available</span>
        <p style="color: var(--color-text-muted); font-size: 14px;">Nenhum agendamento próximo</p>
      </div>
    `;
    return;
  }

  appointmentData.forEach((appointment, index) => {
    const item = createAppointmentItem(appointment, index === 0);
    appointmentsList.appendChild(item);
  });
}

/**
 * Create appointment item element
 */
function createAppointmentItem(appointment, isFirst = false) {
  const statusColors = {
    scheduled: 'gray',
    confirmed: 'green',
    waiting: 'yellow',
    in_progress: 'blue',
  };

  const statusColor = statusColors[appointment.status] || 'gray';
  const isActive = appointment.status === 'in_progress' || appointment.status === 'waiting';

  const item = createElement('div', {
    className: `appointment-item ${isActive ? 'active' : ''}`,
  });

  // Determine what name to show based on role
  let displayName, displayType;
  if (currentUser.role === 'patient') {
    displayName = appointment.professional?.name || 'Profissional';
    displayType = formatSpecialty(appointment.professional?.specialty);
  } else {
    displayName = appointment.patient?.name || 'Paciente';
    displayType = `${getStatusLabel(appointment.status)} - ${formatSpecialty(
      appointment.professional?.specialty
    )}`;
  }

  item.innerHTML = `
    <div class="appointment-status ${statusColor}"></div>
    <div class="appointment-content">
      <div class="appointment-header">
        <h4 class="appointment-name">${displayName}</h4>
        <span class="appointment-time ${isActive ? 'active' : 'default'}">
          ${isActive ? 'Agora' : formatTime(appointment.time)}
        </span>
      </div>
      <p class="appointment-type">${displayType}</p>
      <div class="appointment-doctor">
        <div class="appointment-doctor-avatar" style="background-color: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-size: 10px; font-weight: bold;">
          ${currentUser.role === 'patient' ? getUserInitials(appointment.professional) : getUserInitials(appointment.patient)}
        </div>
        <span class="appointment-doctor-name">${formatDate(appointment.date)}</span>
      </div>
    </div>
  `;

  return item;
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await authLogout();
    success('Logout realizado');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 500);
  } catch (err) {
    error('Erro ao fazer logout');
  }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  const sidebar = document.getElementById('mobileSidebar');

  // Clone sidebar content if empty
  if (!sidebar.innerHTML.trim()) {
    const originalSidebar = document.getElementById('sidebar');
    sidebar.innerHTML = originalSidebar.innerHTML;
  }

  backdrop.classList.add('active');
  sidebar.classList.add('active');
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  const sidebar = document.getElementById('mobileSidebar');

  backdrop.classList.remove('active');
  sidebar.classList.remove('active');
}

/**
 * Open appointment modal
 */
function openAppointmentModal() {
  appointmentModal.classList.add('active');
  appointmentForm.reset();
  professionalSelect.disabled = true;
  timeSelect.disabled = true;
}

/**
 * Close modal
 */
function closeModal() {
  appointmentModal.classList.remove('active');
}

/**
 * Handle specialty change
 */
async function handleSpecialtyChange() {
  const specialty = specialtySelect.value;

  if (!specialty) {
    professionalSelect.disabled = true;
    professionalSelect.innerHTML = '<option value="">Selecione a especialidade primeiro</option>';
    return;
  }

  try {
    professionalSelect.disabled = true;
    professionalSelect.innerHTML = '<option value="">Carregando...</option>';

    const response = await professionals.list({ specialty });
    // Backend retorna { data: [...], pagination: {...} } ou array diretamente
    const professionalsList = response.data || (Array.isArray(response) ? response : []);

    if (professionalsList.length === 0) {
      professionalSelect.innerHTML =
        '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    professionalSelect.innerHTML = '<option value="">Selecione o profissional</option>';
    professionalsList.forEach((prof) => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = `${prof.name} - ${formatCurrency(prof.consultation_price)}`;
      professionalSelect.appendChild(option);
    });

    professionalSelect.disabled = false;
  } catch (err) {
    console.error('Error loading professionals:', err);
    professionalSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    error('Erro ao carregar profissionais');
  }
}

/**
 * Handle professional change
 */
function handleProfessionalChange() {
  if (professionalSelect.value && dateInput.value) {
    loadAvailableSlots();
  }
}

/**
 * Handle date change
 */
function handleDateChange() {
  if (professionalSelect.value && dateInput.value) {
    loadAvailableSlots();
  }
}

/**
 * Load available time slots
 */
async function loadAvailableSlots() {
  const professionalId = professionalSelect.value;
  const date = dateInput.value;

  if (!professionalId || !date) return;

  try {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Carregando horários...</option>';

    // Backend retorna array de { date, time, is_available } diretamente
    const response = await professionals.getAvailability(professionalId, {
      days_ahead: 7,
    });

    // Filtrar slots para a data selecionada
    const allSlots = Array.isArray(response) ? response : (response.data || []);
    const availableSlots = allSlots.filter(
      (slot) => slot.date === date && slot.is_available
    );

    if (availableSlots.length === 0) {
      timeSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
      return;
    }

    timeSelect.innerHTML = '<option value="">Selecione o horário</option>';
    availableSlots.forEach((slot) => {
      const option = document.createElement('option');
      option.value = slot.time;
      option.textContent = slot.time;
      timeSelect.appendChild(option);
    });

    timeSelect.disabled = false;
  } catch (err) {
    console.error('Error loading slots:', err);
    timeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    error('Erro ao carregar horários');
  }
}

/**
 * Handle appointment form submit
 */
async function handleAppointmentSubmit(e) {
  e.preventDefault();

  const formData = new FormData(appointmentForm);
  const data = {
    professional_id: parseInt(formData.get('professional_id')),
    date: formData.get('date'),
    time: formData.get('time'),
    type: formData.get('type'),
  };

  // For patients, use their own ID
  if (currentUser.role === 'patient') {
    data.patient_id = currentUser.id;
  } else {
    data.patient_id = parseInt(formData.get('patient_id'));
  }

  if (!data.professional_id || !data.date || !data.time || !data.patient_id) {
    error('Preencha todos os campos obrigatórios');
    return;
  }

  try {
    const confirmBtn = document.getElementById('confirmAppointment');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML =
      '<span class="loading-spinner"></span> <span>Processando...</span>';

    await appointments.create(data);

    success('Agendamento realizado com sucesso!');
    closeModal();

    // Reload appointments
    await loadAppointments();
    await loadMetrics();
  } catch (err) {
    console.error('Error creating appointment:', err);

    if (err.code === 'SLOT_NOT_AVAILABLE') {
      error('Horário indisponível', 'Por favor, escolha outro horário');
    } else if (err.code === 'DUPLICATE_APPOINTMENT') {
      error('Agendamento duplicado', err.message);
    } else {
      error(err.message || 'Erro ao criar agendamento');
    }
  } finally {
    const confirmBtn = document.getElementById('confirmAppointment');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<span>Confirmar Agendamento</span>';
  }
}

/**
 * Handle search
 */
function handleSearch(e) {
  const query = e.target.value.trim();
  if (query) {
    info(`Buscando por "${query}"...`);
    // TODO: Implement search functionality
  }
}

/**
 * Handle chart period change
 */
function handleChartPeriodChange(e) {
  document.querySelectorAll('.chart-btn').forEach((btn) => btn.classList.remove('active'));
  e.target.classList.add('active');

  // TODO: Reload chart data for selected period
  const period = e.target.dataset.period;
  console.log('Chart period changed to:', period);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
