/**
 * MedClinic Professionals Page
 */

import { professionals, appointments } from '../services/api.js';
import { requireAuth, getRoleLabel, getUserInitials, formatSpecialty, logout as authLogout } from '../services/auth.js';
import { success, error } from '../utils/toast.js';
import { formatCurrency, getTodayISO, getDateFromNow, debounce } from '../utils/helpers.js';

let currentUser = null;
let currentPage = 1;
let selectedProfessional = null;

const professionalsGrid = document.getElementById('professionalsGrid');
const filterSpecialty = document.getElementById('filterSpecialty');
const filterName = document.getElementById('filterName');
const pagination = document.getElementById('pagination');

async function init() {
  try {
    currentUser = await requireAuth();
    setupUI();
    setupEventListeners();
    await loadProfessionals();
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

  document.getElementById('applyFilters').addEventListener('click', () => {
    currentPage = 1;
    loadProfessionals();
  });

  filterName.addEventListener('input', debounce(() => {
    currentPage = 1;
    loadProfessionals();
  }, 500));

  filterSpecialty.addEventListener('change', () => {
    currentPage = 1;
    loadProfessionals();
  });

  // Schedule modal
  document.getElementById('closeScheduleModal').addEventListener('click', closeScheduleModal);
  document.getElementById('cancelSchedule').addEventListener('click', closeScheduleModal);
  document.getElementById('scheduleModal').addEventListener('click', (e) => {
    if (e.target.id === 'scheduleModal') closeScheduleModal();
  });

  const dateInput = document.getElementById('scheduleDate');
  dateInput.min = getTodayISO();
  dateInput.max = getDateFromNow(90);
  dateInput.addEventListener('change', loadAvailableSlots);

  document.getElementById('confirmSchedule').addEventListener('click', handleSchedule);
}

async function loadProfessionals() {
  const params = { page: currentPage, pageSize: 9 };
  if (filterSpecialty.value) params.specialty = filterSpecialty.value;
  if (filterName.value) params.name = filterName.value;

  try {
    professionalsGrid.innerHTML = Array(6).fill('<div class="skeleton" style="height: 200px; border-radius: var(--radius-xl);"></div>').join('');

    const response = await professionals.list(params);
    const data = response.data || [];
    const paginationData = response.pagination || {};

    renderProfessionals(data);
    renderPagination(paginationData);
  } catch (err) {
    console.error('Error:', err);
    professionalsGrid.innerHTML = '<div class="empty-state"><p>Erro ao carregar profissionais</p></div>';
    error('Erro ao carregar profissionais');
  }
}

function renderProfessionals(data) {
  if (data.length === 0) {
    professionalsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-symbols-outlined icon">search_off</span>
        <h3>Nenhum profissional encontrado</h3>
        <p>Tente alterar os filtros de busca</p>
      </div>
    `;
    return;
  }

  professionalsGrid.innerHTML = data.map(prof => `
    <div class="professional-card">
      <div class="professional-header">
        <div class="professional-avatar" style="background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: bold; font-size: 18px;">
          ${getInitials(prof.name)}
        </div>
        <div class="professional-info">
          <h4>${prof.name}</h4>
          <p>${prof.registration_number || ''}</p>
        </div>
      </div>
      <span class="professional-specialty">${formatSpecialty(prof.specialty)}</span>
      <div class="professional-price">
        <span class="label">Valor da consulta</span>
        <span class="value">${formatCurrency(prof.consultation_price)}</span>
      </div>
      <button class="btn btn-primary btn-block" onclick="window.openScheduleModal(${prof.id}, '${prof.name}', '${prof.specialty}', ${prof.consultation_price})">
        <span class="material-symbols-outlined icon">calendar_month</span>
        Agendar Consulta
      </button>
    </div>
  `).join('');
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase();
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

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">
    <span class="material-symbols-outlined">chevron_right</span>
  </button>`;

  pagination.innerHTML = html;
  pagination.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      loadProfessionals();
    });
  });
}

window.openScheduleModal = function(id, name, specialty, price) {
  selectedProfessional = { id, name, specialty, price };

  document.getElementById('professionalInfo').innerHTML = `
    <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: bold; font-size: 20px;">
      ${getInitials(name)}
    </div>
    <div>
      <h4 style="color: var(--color-text-primary); font-size: var(--font-size-lg); margin-bottom: 4px;">${name}</h4>
      <p style="color: var(--color-text-muted); font-size: var(--font-size-sm);">${formatSpecialty(specialty)}</p>
      <p style="color: var(--color-primary); font-weight: bold; margin-top: 4px;">${formatCurrency(price)}</p>
    </div>
  `;

  document.getElementById('scheduleDate').value = '';
  document.getElementById('scheduleTime').innerHTML = '<option value="">Selecione a data primeiro</option>';
  document.getElementById('scheduleTime').disabled = true;
  document.getElementById('scheduleModal').classList.add('active');
};

function closeScheduleModal() {
  selectedProfessional = null;
  document.getElementById('scheduleModal').classList.remove('active');
}

async function loadAvailableSlots() {
  const date = document.getElementById('scheduleDate').value;
  const timeSelect = document.getElementById('scheduleTime');

  if (!date || !selectedProfessional) return;

  try {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Carregando...</option>';

    const response = await professionals.getAvailability(selectedProfessional.id, {
      startDate: date,
      endDate: date,
    });

    const dayData = (response.data || []).find(d => d.date === date);
    const slots = dayData?.slots?.filter(s => s.available) || [];

    if (slots.length === 0) {
      timeSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
      return;
    }

    timeSelect.innerHTML = '<option value="">Selecione o horário</option>' +
      slots.map(s => `<option value="${s.time}">${s.time}</option>`).join('');
    timeSelect.disabled = false;
  } catch (err) {
    console.error('Error:', err);
    timeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

async function handleSchedule() {
  if (!selectedProfessional) return;

  const date = document.getElementById('scheduleDate').value;
  const time = document.getElementById('scheduleTime').value;
  const type = document.getElementById('scheduleType').value;

  if (!date || !time) {
    error('Selecione data e horário');
    return;
  }

  const btn = document.getElementById('confirmSchedule');
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Processando...';

    await appointments.create({
      patient_id: currentUser.id,
      professional_id: selectedProfessional.id,
      date,
      time,
      type,
    });

    success('Agendamento realizado com sucesso!');
    closeScheduleModal();
  } catch (err) {
    console.error('Error:', err);
    error(err.message || 'Erro ao agendar consulta');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined icon">check</span> Confirmar Agendamento';
  }
}

async function handleLogout() {
  await authLogout();
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', init);
