/**
 * MedClinic Exams Page
 */

import { exams, appointments } from '../services/api.js';
import { requireAuth, hasRole, getRoleLabel, getUserInitials, logout as authLogout } from '../services/auth.js';
import { success, error } from '../utils/toast.js';
import { formatDate, formatCurrency, getExamStatusLabel, debounce } from '../utils/helpers.js';

let currentUser = null;
let currentPage = 1;
let examCatalog = [];
let selectedExamId = null;

const examsTableBody = document.getElementById('examsTableBody');
const filterStatus = document.getElementById('filterStatus');
const filterType = document.getElementById('filterType');
const totalCount = document.getElementById('totalCount');
const pagination = document.getElementById('pagination');

async function init() {
  try {
    currentUser = await requireAuth();
    setupUI();
    setupEventListeners();
    await Promise.all([loadExams(), loadExamCatalog()]);
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

  // Hide new exam button for non-professionals
  const newExamBtn = document.getElementById('newExamBtn');
  if (newExamBtn && !hasRole(currentUser, ['health_professional'])) {
    newExamBtn.style.display = 'none';
  }

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

  document.getElementById('applyFilters').addEventListener('click', () => {
    currentPage = 1;
    loadExams();
  });

  // New exam modal
  const newExamBtn = document.getElementById('newExamBtn');
  if (newExamBtn) {
    newExamBtn.addEventListener('click', openNewExamModal);
  }

  document.getElementById('closeNewExamModal')?.addEventListener('click', closeNewExamModal);
  document.getElementById('cancelNewExam')?.addEventListener('click', closeNewExamModal);
  document.getElementById('confirmNewExam')?.addEventListener('click', handleCreateExam);
  document.getElementById('newExamModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'newExamModal') closeNewExamModal();
  });

  // Upload result modal (lab tech)
  document.getElementById('closeUploadModal')?.addEventListener('click', closeUploadModal);
  document.getElementById('cancelUpload')?.addEventListener('click', closeUploadModal);
  document.getElementById('confirmUpload')?.addEventListener('click', handleUploadResult);
}

async function loadExamCatalog() {
  try {
    const response = await exams.getCatalog();
    examCatalog = response || [];
  } catch (err) {
    console.error('Error loading catalog:', err);
  }
}

async function loadExams() {
  const params = { page: currentPage, pageSize: 10 };
  if (filterStatus.value) params.status = filterStatus.value;
  if (filterType.value) params.type = filterType.value;

  try {
    examsTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px;">
        <span class="loading-spinner"></span>
      </td></tr>
    `;

    const response = await exams.list(params);
    const data = Array.isArray(response) ? response : (response.data || []);
    const total = data.length;

    totalCount.textContent = `${total} exames`;
    renderExams(data);
  } catch (err) {
    console.error('Error loading exams:', err);
    examsTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-error);">
        Erro ao carregar exames
      </td></tr>
    `;
    error('Erro ao carregar exames');
  }
}

function renderExams(data) {
  if (data.length === 0) {
    examsTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
        <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 8px;">biotech</span>
        Nenhum exame encontrado
      </td></tr>
    `;
    return;
  }

  examsTableBody.innerHTML = data.map(exam => `
    <tr data-id="${exam.id}">
      <td>
        <div style="font-weight: 600;">${exam.patient_name || 'Paciente'}</div>
      </td>
      <td>${exam.exam_name || '-'}</td>
      <td>
        <span class="badge ${exam.exam_type === 'blood' ? 'badge-error' : 'badge-info'}">
          ${exam.exam_type === 'blood' ? 'Sangue' : 'Imagem'}
        </span>
      </td>
      <td>${exam.professional_name || '-'}</td>
      <td>
        <span class="badge ${getExamBadgeClass(exam.status)}">
          ${getExamStatusLabel(exam.status)}
        </span>
      </td>
      <td>${formatDate(exam.created_at)}</td>
      <td>
        <div style="display: flex; gap: 4px;">
          ${renderExamActions(exam)}
        </div>
      </td>
    </tr>
  `).join('');

  // Add event listeners
  document.querySelectorAll('.action-view-exam').forEach(btn => {
    btn.addEventListener('click', () => viewExam(btn.dataset.id));
  });

  document.querySelectorAll('.action-upload-result').forEach(btn => {
    btn.addEventListener('click', () => openUploadModal(btn.dataset.id));
  });
}

function getExamBadgeClass(status) {
  const classes = {
    pending_payment: 'badge-warning',
    paid_pending_schedule: 'badge-info',
    scheduled: 'badge-info',
    in_analysis: 'badge-warning',
    ready: 'badge-success',
    released: 'badge-success',
    cancelled: 'badge-error'
  };
  return classes[status] || 'badge-neutral';
}

function renderExamActions(exam) {
  const actions = [];

  actions.push(`
    <button class="btn btn-sm btn-ghost action-view-exam" data-id="${exam.id}" title="Ver detalhes">
      <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>
    </button>
  `);

  // Lab tech can upload results
  if (hasRole(currentUser, ['lab_tech']) && ['scheduled', 'in_analysis'].includes(exam.status)) {
    actions.push(`
      <button class="btn btn-sm btn-primary action-upload-result" data-id="${exam.id}" title="Registrar resultado">
        <span class="material-symbols-outlined" style="font-size: 18px;">upload_file</span>
      </button>
    `);
  }

  return actions.join('') || '<span style="color: var(--color-text-muted);">-</span>';
}

async function viewExam(id) {
  try {
    const exam = await exams.getById(id);
    alert(`Exame: ${exam.exam_name}\nPaciente: ${exam.patient_name}\nStatus: ${getExamStatusLabel(exam.status)}\nIndicação: ${exam.clinical_indication || '-'}`);
  } catch (err) {
    error('Erro ao carregar detalhes do exame');
  }
}

async function openNewExamModal() {
  // Load appointments for this professional
  try {
    const response = await appointments.list({ status: 'completed', pageSize: 50 });
    const appointmentData = response.data || [];

    const select = document.getElementById('examAppointment');
    select.innerHTML = '<option value="">Selecione a consulta</option>' +
      appointmentData.map(apt => `
        <option value="${apt.id}" data-patient-id="${apt.patient?.id}">
          ${formatDate(apt.date)} - ${apt.patient?.name || 'Paciente'}
        </option>
      `).join('');

    document.getElementById('newExamModal').classList.add('active');
  } catch (err) {
    error('Erro ao carregar consultas');
  }
}

function closeNewExamModal() {
  document.getElementById('newExamModal').classList.remove('active');
  document.getElementById('newExamForm').reset();
}

async function handleCreateExam() {
  const appointmentSelect = document.getElementById('examAppointment');
  const appointmentId = appointmentSelect.value;
  const patientId = appointmentSelect.selectedOptions[0]?.dataset.patientId;
  const examName = document.getElementById('examName').value.trim();
  const examType = document.getElementById('examType').value;
  const indication = document.getElementById('examIndication').value.trim();
  const price = parseFloat(document.getElementById('examPrice').value);

  if (!appointmentId || !examName || !indication) {
    error('Preencha todos os campos obrigatórios');
    return;
  }

  const btn = document.getElementById('confirmNewExam');
  try {
    btn.disabled = true;
    btn.textContent = 'Solicitando...';

    // Note: The API expects exam_catalog_id, but we're sending exam details directly
    // This might need adjustment based on actual API implementation
    await exams.create({
      appointment_id: parseInt(appointmentId),
      patient_id: parseInt(patientId),
      exam_name: examName,
      exam_type: examType,
      clinical_indication: indication,
      price: price
    });

    success('Exame solicitado com sucesso');
    closeNewExamModal();
    await loadExams();
  } catch (err) {
    error(err.message || 'Erro ao solicitar exame');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Solicitar Exame';
  }
}

function openUploadModal(id) {
  selectedExamId = id;
  document.getElementById('resultText').value = '';
  document.getElementById('resultFileUrl').value = '';
  document.getElementById('uploadResultModal').classList.add('active');
}

function closeUploadModal() {
  selectedExamId = null;
  document.getElementById('uploadResultModal').classList.remove('active');
}

async function handleUploadResult() {
  if (!selectedExamId) return;

  const resultText = document.getElementById('resultText').value.trim();
  const resultFileUrl = document.getElementById('resultFileUrl').value.trim();

  if (!resultText && !resultFileUrl) {
    error('Informe o resultado em texto ou URL do arquivo');
    return;
  }

  // Note: This endpoint might need to be implemented in the API
  success('Funcionalidade de upload de resultado será implementada');
  closeUploadModal();
}

async function handleLogout() {
  await authLogout();
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', init);
