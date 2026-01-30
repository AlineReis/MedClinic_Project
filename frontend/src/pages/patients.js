/**
 * MedClinic Patients Page
 */

import { users } from '../services/api.js';
import { requireAuth, hasRole, getRoleLabel, getUserInitials, logout as authLogout } from '../services/auth.js';
import { success, error } from '../utils/toast.js';
import { formatDate, debounce } from '../utils/helpers.js';

let currentUser = null;
let currentPage = 1;
let selectedPatientId = null;

const patientsList = document.getElementById('patientsList');
const searchPatient = document.getElementById('searchPatient');
const totalCount = document.getElementById('totalCount');
const pagination = document.getElementById('pagination');

async function init() {
  try {
    currentUser = await requireAuth();

    // Only allow certain roles
    if (!hasRole(currentUser, ['health_professional', 'receptionist', 'clinic_admin', 'system_admin'])) {
      window.location.href = 'dashboard.html';
      return;
    }

    setupUI();
    setupEventListeners();
    await loadPatients();
  } catch (err) {
    console.error('Init error:', err);
  }
}

function setupUI() {
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = getRoleLabel(currentUser.role);
  const avatar = document.getElementById('userAvatar');
  avatar.textContent = getUserInitials(currentUser);
  avatar.style.cssText = 'background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: bold; font-size: 14px;';

  // Setup navigation visibility
  const navLinks = document.querySelectorAll('.nav-link[data-roles]');
  navLinks.forEach(link => {
    const roles = link.dataset.roles.split(',');
    if (!hasRole(currentUser, roles)) {
      link.style.display = 'none';
    }
  });
}

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

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

  document.getElementById('searchBtn').addEventListener('click', () => {
    currentPage = 1;
    loadPatients();
  });

  searchPatient.addEventListener('input', debounce(() => {
    currentPage = 1;
    loadPatients();
  }, 500));

  searchPatient.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      loadPatients();
    }
  });

  // Patient modal
  document.getElementById('closePatientModal').addEventListener('click', closePatientModal);
  document.getElementById('closePatientBtn').addEventListener('click', closePatientModal);
  document.getElementById('patientModal').addEventListener('click', (e) => {
    if (e.target.id === 'patientModal') closePatientModal();
  });

  document.getElementById('scheduleForPatient').addEventListener('click', () => {
    if (selectedPatientId) {
      // Redirect to dashboard with patient ID to pre-select
      window.location.href = `dashboard.html?patient_id=${selectedPatientId}`;
    }
  });
}

async function loadPatients() {
  const params = {
    role: 'patient',
    page: currentPage,
    pageSize: 10
  };

  if (searchPatient.value.trim()) {
    params.search = searchPatient.value.trim();
  }

  try {
    patientsList.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <span class="loading-spinner"></span>
      </div>
    `;

    const response = await users.list(params);
    // Backend retorna: { success, users: { items, page, pageSize, total, totalPages } }
    const usersData = response.users || {};
    const data = usersData.items || [];
    const paginationData = {
      page: usersData.page || 1,
      pageSize: usersData.pageSize || 10,
      total: usersData.total || 0,
      totalPages: usersData.totalPages || 1
    };

    totalCount.textContent = `${paginationData.total} pacientes`;
    renderPatients(data);
    renderPagination(paginationData);
  } catch (err) {
    console.error('Error loading patients:', err);
    patientsList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--color-error);">
        Erro ao carregar pacientes
      </div>
    `;
    error('Erro ao carregar pacientes');
  }
}

function renderPatients(data) {
  if (data.length === 0) {
    patientsList.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined icon">person_search</span>
        <h3>Nenhum paciente encontrado</h3>
        <p>Tente buscar com outros termos</p>
      </div>
    `;
    return;
  }

  patientsList.innerHTML = data.map(patient => `
    <div class="patient-card" data-id="${patient.id}">
      <div class="patient-avatar">
        ${getUserInitials(patient)}
      </div>
      <div class="patient-info">
        <h4 class="patient-name">${patient.name}</h4>
        <p class="patient-details">${patient.email} ${patient.phone ? `| ${patient.phone}` : ''}</p>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-ghost action-view" data-id="${patient.id}" title="Ver detalhes">
          <span class="material-symbols-outlined">visibility</span>
        </button>
        <button class="btn btn-sm btn-primary action-schedule" data-id="${patient.id}" title="Agendar consulta">
          <span class="material-symbols-outlined">calendar_month</span>
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners
  document.querySelectorAll('.action-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPatientModal(btn.dataset.id);
    });
  });

  document.querySelectorAll('.action-schedule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `dashboard.html?patient_id=${btn.dataset.id}`;
    });
  });

  document.querySelectorAll('.patient-card').forEach(card => {
    card.addEventListener('click', () => openPatientModal(card.dataset.id));
  });
}

function renderPagination(paginationData) {
  const { page, totalPages } = paginationData;
  if (!totalPages || totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
    <span class="material-symbols-outlined">chevron_left</span>
  </button>`;

  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">
    <span class="material-symbols-outlined">chevron_right</span>
  </button>`;

  pagination.innerHTML = html;
  pagination.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      loadPatients();
    });
  });
}

async function openPatientModal(id) {
  selectedPatientId = id;

  try {
    const response = await users.getById(id);
    const patient = response.user || response;

    document.getElementById('patientDetails').innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--spacing-4); margin-bottom: var(--spacing-6); padding-bottom: var(--spacing-4); border-bottom: 1px solid var(--color-border);">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">
          ${getUserInitials(patient)}
        </div>
        <div>
          <h3 style="color: var(--color-text-primary); font-size: var(--font-size-xl); margin-bottom: 4px;">${patient.name}</h3>
          <p style="color: var(--color-text-muted); font-size: var(--font-size-sm);">Paciente desde ${formatDate(patient.created_at)}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-4);">
        <div>
          <p style="color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; margin-bottom: 4px;">E-mail</p>
          <p style="color: var(--color-text-primary);">${patient.email}</p>
        </div>
        <div>
          <p style="color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; margin-bottom: 4px;">Telefone</p>
          <p style="color: var(--color-text-primary);">${patient.phone || '-'}</p>
        </div>
        <div>
          <p style="color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; margin-bottom: 4px;">CPF</p>
          <p style="color: var(--color-text-primary);">${formatCPF(patient.cpf) || '-'}</p>
        </div>
        <div>
          <p style="color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; margin-bottom: 4px;">ID</p>
          <p style="color: var(--color-text-primary);">#${patient.id}</p>
        </div>
      </div>
    `;

    document.getElementById('patientModal').classList.add('active');
  } catch (err) {
    error('Erro ao carregar dados do paciente');
  }
}

function closePatientModal() {
  selectedPatientId = null;
  document.getElementById('patientModal').classList.remove('active');
}

function formatCPF(cpf) {
  if (!cpf) return null;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0,3)}.${clean.slice(3,6)}.${clean.slice(6,9)}-${clean.slice(9)}`;
}

async function handleLogout() {
  await authLogout();
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', init);
