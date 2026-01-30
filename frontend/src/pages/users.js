/**
 * MedClinic Users Page (Admin)
 */

import { users } from '../services/api.js';
import { requireRole, getRoleLabel, getUserInitials, logout as authLogout } from '../services/auth.js';
import { success, error } from '../utils/toast.js';
import { formatDate, debounce } from '../utils/helpers.js';

let currentUser = null;
let currentPage = 1;
let selectedUserId = null;

const usersTableBody = document.getElementById('usersTableBody');
const filterRole = document.getElementById('filterRole');
const filterSearch = document.getElementById('filterSearch');
const totalCount = document.getElementById('totalCount');
const pagination = document.getElementById('pagination');

async function init() {
  try {
    // Require admin role
    currentUser = await requireRole(['clinic_admin', 'system_admin']);
    setupUI();
    setupEventListeners();
    await loadUsers();
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
    loadUsers();
  });

  filterSearch.addEventListener('input', debounce(() => {
    currentPage = 1;
    loadUsers();
  }, 500));

  filterRole.addEventListener('change', () => {
    currentPage = 1;
    loadUsers();
  });

  // Edit modal
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('saveEdit').addEventListener('click', handleSaveEdit);
  document.getElementById('editUserModal').addEventListener('click', (e) => {
    if (e.target.id === 'editUserModal') closeEditModal();
  });

  // Delete modal
  document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDelete').addEventListener('click', handleDeleteUser);
  document.getElementById('deleteUserModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteUserModal') closeDeleteModal();
  });
}

async function loadUsers() {
  const params = { page: currentPage, pageSize: 15 };
  if (filterRole.value) params.role = filterRole.value;
  if (filterSearch.value) params.search = filterSearch.value;

  try {
    usersTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px;">
        <span class="loading-spinner"></span>
      </td></tr>
    `;

    const response = await users.list(params);
    // Backend retorna: { success, users: { items, page, pageSize, total, totalPages } }
    const usersData = response.users || {};
    const data = usersData.items || [];
    const paginationData = {
      page: usersData.page || 1,
      pageSize: usersData.pageSize || 15,
      total: usersData.total || 0,
      totalPages: usersData.totalPages || 1
    };

    totalCount.textContent = `${paginationData.total} usuários`;
    renderUsers(data);
    renderPagination(paginationData);
  } catch (err) {
    console.error('Error loading users:', err);
    usersTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-error);">
        Erro ao carregar usuários
      </td></tr>
    `;
    error('Erro ao carregar usuários');
  }
}

function renderUsers(data) {
  if (data.length === 0) {
    usersTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
        <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 8px;">person_search</span>
        Nenhum usuário encontrado
      </td></tr>
    `;
    return;
  }

  usersTableBody.innerHTML = data.map(user => `
    <tr data-id="${user.id}">
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">
            ${getUserInitials(user)}
          </div>
          <span style="font-weight: 600;">${user.name}</span>
        </div>
      </td>
      <td>${user.email}</td>
      <td>
        <span class="badge ${getRoleBadgeClass(user.role)}">
          ${getRoleLabel(user.role)}
        </span>
      </td>
      <td>${formatCPF(user.cpf) || '-'}</td>
      <td>${user.phone || '-'}</td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button class="btn btn-sm btn-ghost action-edit" data-id="${user.id}" title="Editar">
            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
          </button>
          ${user.id !== currentUser.id ? `
            <button class="btn btn-sm btn-ghost action-delete" data-id="${user.id}" data-name="${user.name}" title="Desativar" style="color: var(--color-error);">
              <span class="material-symbols-outlined" style="font-size: 18px;">person_off</span>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  // Add event listeners
  document.querySelectorAll('.action-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  document.querySelectorAll('.action-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
  });
}

function getRoleBadgeClass(role) {
  const classes = {
    patient: 'badge-info',
    receptionist: 'badge-neutral',
    lab_tech: 'badge-warning',
    health_professional: 'badge-success',
    clinic_admin: 'badge-error',
    system_admin: 'badge-error'
  };
  return classes[role] || 'badge-neutral';
}

function formatCPF(cpf) {
  if (!cpf) return null;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0,3)}.${clean.slice(3,6)}.${clean.slice(6,9)}-${clean.slice(9)}`;
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
      loadUsers();
    });
  });
}

async function openEditModal(id) {
  try {
    const response = await users.getById(id);
    const user = response.user || response;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone || '';

    document.getElementById('editUserModal').classList.add('active');
  } catch (err) {
    error('Erro ao carregar dados do usuário');
  }
}

function closeEditModal() {
  document.getElementById('editUserModal').classList.remove('active');
  document.getElementById('editUserForm').reset();
}

async function handleSaveEdit() {
  const id = document.getElementById('editUserId').value;
  const name = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const phone = document.getElementById('editPhone').value.trim();

  if (!name || !email) {
    error('Nome e email são obrigatórios');
    return;
  }

  const btn = document.getElementById('saveEdit');
  try {
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    await users.update(id, { name, email, phone: phone || undefined });

    success('Usuário atualizado com sucesso');
    closeEditModal();
    await loadUsers();
  } catch (err) {
    error(err.message || 'Erro ao atualizar usuário');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Alterações';
  }
}

function openDeleteModal(id, name) {
  selectedUserId = id;
  document.getElementById('deleteUserName').textContent = name;
  document.getElementById('deleteUserModal').classList.add('active');
}

function closeDeleteModal() {
  selectedUserId = null;
  document.getElementById('deleteUserModal').classList.remove('active');
}

async function handleDeleteUser() {
  if (!selectedUserId) return;

  const btn = document.getElementById('confirmDelete');
  try {
    btn.disabled = true;
    btn.textContent = 'Desativando...';

    await users.delete(selectedUserId);

    success('Usuário desativado com sucesso');
    closeDeleteModal();
    await loadUsers();
  } catch (err) {
    if (err.message?.includes('pending')) {
      error('Usuário possui registros pendentes e não pode ser desativado');
    } else {
      error(err.message || 'Erro ao desativar usuário');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Desativar';
  }
}

async function handleLogout() {
  await authLogout();
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', init);
