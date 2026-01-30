/**
 * MedClinic Prescriptions Page
 */

import { prescriptions, appointments } from '../services/api.js';
import { requireAuth, hasRole, getRoleLabel, getUserInitials, logout as authLogout } from '../services/auth.js';
import { success, error } from '../utils/toast.js';
import { formatDate } from '../utils/helpers.js';

let currentUser = null;

const prescriptionsList = document.getElementById('prescriptionsList');
const totalCount = document.getElementById('totalCount');

async function init() {
  try {
    currentUser = await requireAuth();
    setupUI();
    setupEventListeners();
    await loadPrescriptions();
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

  // Hide new prescription button for non-professionals
  const newBtn = document.getElementById('newPrescriptionBtn');
  if (newBtn && !hasRole(currentUser, ['health_professional'])) {
    newBtn.style.display = 'none';
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

  // New prescription modal
  const newBtn = document.getElementById('newPrescriptionBtn');
  if (newBtn) {
    newBtn.addEventListener('click', openNewPrescriptionModal);
  }

  document.getElementById('closeNewPrescriptionModal')?.addEventListener('click', closeNewPrescriptionModal);
  document.getElementById('cancelNewPrescription')?.addEventListener('click', closeNewPrescriptionModal);
  document.getElementById('confirmNewPrescription')?.addEventListener('click', handleCreatePrescription);
  document.getElementById('newPrescriptionModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'newPrescriptionModal') closeNewPrescriptionModal();
  });
}

async function loadPrescriptions() {
  try {
    prescriptionsList.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <span class="loading-spinner"></span>
      </div>
    `;

    const response = await prescriptions.list();
    const data = Array.isArray(response) ? response : (response.data || []);

    totalCount.textContent = `${data.length} prescrições`;
    renderPrescriptions(data);
  } catch (err) {
    console.error('Error loading prescriptions:', err);
    prescriptionsList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--color-error);">
        Erro ao carregar prescrições
      </div>
    `;
    error('Erro ao carregar prescrições');
  }
}

function renderPrescriptions(data) {
  if (data.length === 0) {
    prescriptionsList.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined icon">medication</span>
        <h3>Nenhuma prescrição encontrada</h3>
        <p>As prescrições aparecerão aqui após as consultas</p>
      </div>
    `;
    return;
  }

  prescriptionsList.innerHTML = data.map(prescription => `
    <div class="prescription-card">
      <div class="prescription-header">
        <div>
          <h4 class="prescription-medication">${prescription.medication_name}</h4>
          ${prescription.is_controlled ? '<span class="badge badge-warning" style="margin-left: 8px;">Controlado</span>' : ''}
        </div>
        <span class="text-muted">${formatDate(prescription.created_at)}</span>
      </div>
      <div class="prescription-details">
        <div class="prescription-detail">
          <span class="label">Dosagem</span>
          <span class="value">${prescription.dosage || '-'}</span>
        </div>
        <div class="prescription-detail">
          <span class="label">Instruções</span>
          <span class="value">${prescription.instructions || '-'}</span>
        </div>
        <div class="prescription-detail">
          <span class="label">Paciente</span>
          <span class="value">${prescription.patient_name || '-'}</span>
        </div>
        <div class="prescription-detail">
          <span class="label">Profissional</span>
          <span class="value">${prescription.professional_name || '-'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function openNewPrescriptionModal() {
  try {
    const response = await appointments.list({ status: 'completed', pageSize: 50 });
    const appointmentData = response.data || [];

    const select = document.getElementById('prescriptionAppointment');
    select.innerHTML = '<option value="">Selecione a consulta</option>' +
      appointmentData.map(apt => `
        <option value="${apt.id}" data-patient-id="${apt.patient?.id}">
          ${formatDate(apt.date)} - ${apt.patient?.name || 'Paciente'}
        </option>
      `).join('');

    document.getElementById('newPrescriptionModal').classList.add('active');
  } catch (err) {
    error('Erro ao carregar consultas');
  }
}

function closeNewPrescriptionModal() {
  document.getElementById('newPrescriptionModal').classList.remove('active');
  document.getElementById('newPrescriptionForm').reset();
}

async function handleCreatePrescription() {
  const appointmentSelect = document.getElementById('prescriptionAppointment');
  const appointmentId = appointmentSelect.value;
  const patientId = appointmentSelect.selectedOptions[0]?.dataset.patientId;
  const medicationName = document.getElementById('medicationName').value.trim();
  const dosage = document.getElementById('dosage').value.trim();
  const instructions = document.getElementById('instructions').value.trim();
  const isControlled = document.getElementById('isControlled').checked;

  if (!appointmentId || !medicationName) {
    error('Preencha os campos obrigatórios');
    return;
  }

  const btn = document.getElementById('confirmNewPrescription');
  try {
    btn.disabled = true;
    btn.textContent = 'Criando...';

    await prescriptions.create({
      appointment_id: parseInt(appointmentId),
      patient_id: parseInt(patientId),
      medication_name: medicationName,
      dosage: dosage,
      instructions: instructions,
      is_controlled: isControlled
    });

    success('Prescrição criada com sucesso');
    closeNewPrescriptionModal();
    await loadPrescriptions();
  } catch (err) {
    error(err.message || 'Erro ao criar prescrição');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Prescrição';
  }
}

async function handleLogout() {
  await authLogout();
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', init);
