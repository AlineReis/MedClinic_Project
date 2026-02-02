/**
 * Users management page for admin dashboard
 * Implements user listing, filtering, editing, and deletion
 */

import { formatSpecialty } from "../utils/formatters";
import "../../css/pages/users.css";
import {
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../services/usersService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";
import type { UpdateUserPayload, UserRole, UserSummary } from "../types/users";

let currentPage = 1;
let currentFilters = {
  role: undefined as UserRole | undefined,
  search: "",
};

async function initUsersPage() {
  const session = authStore.getSession();

  if (
    !session ||
    (session.role !== "clinic_admin" && session.role !== "system_admin")
  ) {
    uiStore.addToast(
      "error",
      "Acesso negado. Apenas administradores podem acessar esta página.",
    );
    window.location.href = "/pages/login.html";
    return;
  }

  // Setup filter listeners
  setupFilters();

  // Setup new user button (placeholder - no creation endpoint yet)
  setupNewUserButton();

  // Load initial user list
  await loadUsers();
}

function setupFilters() {
  const searchInput = document.querySelector<HTMLInputElement>(
    "[data-search-input]",
  );
  const roleSelect =
    document.querySelector<HTMLSelectElement>("[data-role-filter]");

  if (searchInput) {
    let debounceTimer: number;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(async () => {
        currentFilters.search = (e.target as HTMLInputElement).value.trim();
        currentPage = 1;
        await loadUsers();
      }, 500);
    });
  }

  if (roleSelect) {
    roleSelect.addEventListener("change", async (e) => {
      const value = (e.target as HTMLSelectElement).value;
      currentFilters.role = value === "all" ? undefined : (value as UserRole);
      currentPage = 1;
      await loadUsers();
    });
  }
}

function setupNewUserButton() {
  const newUserBtn = document.querySelector("[data-new-user-btn]");
  if (newUserBtn) {
    newUserBtn.addEventListener("click", () => {
      uiStore.addToast(
        "info",
        "Criação de usuários será implementada em breve",
      );
    });
  }
}

async function loadUsers() {
  try {
    const response = await listUsers({
      ...currentFilters,
      page: currentPage,
      pageSize: 20,
    });

    if (response.success && response.data) {
      updateUsersTable(response.data.users);
      updatePagination(response.data.pagination);
    } else {
      uiStore.addToast(
        "error",
        response.error?.message || "Erro ao carregar usuários",
      );
      updateUsersTable([]);
    }
  } catch (error) {
    console.error("Error loading users:", error);
    uiStore.addToast("error", "Erro ao carregar usuários");
    updateUsersTable([]);
  }
}

function updateUsersTable(users: UserSummary[]) {
  const tbody = document.querySelector("[data-users-table-body]");
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table__empty">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
            <span class="material-symbols-outlined table__empty-icon">search_off</span>
            <p class="table__empty-text">Nenhum usuário encontrado</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users
    .map((user) => {
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const roleBadge = getRoleBadge(user.role);
      const roleDisplay = getRoleDisplay(user.role);

      return `
      <tr class="table__row" data-user-id="${user.id}">
        <td class="table__cell">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="table__avatar">
              ${initials}
            </div>
            <div>
              <p style="font-weight: 700; color: var(--text-primary); margin: 0;">${escapeHtml(user.name)}</p>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">ID: #${user.id}</p>
            </div>
          </div>
        </td>
        <td class="table__cell table__cell--muted">${escapeHtml(user.email)}</td>
        <td class="table__cell">
          <span class="${roleBadge}">${roleDisplay}</span>
          ${
            user.professional_details
              ? `
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">${escapeHtml(formatSpecialty(user.professional_details.specialty))}</div>
          `
              : ""
          }
        </td>
        <td class="table__cell">
          <span class="badge badge--success">
            Ativo
          </span>
        </td>
        <td class="table__cell table__cell--right">
          <button class="u-text-secondary hover:u-text-primary" style="margin-right: 0.5rem;" data-edit-user="${user.id}">
            <span class="material-symbols-outlined">edit_square</span>
          </button>
          <button class="u-text-secondary hover:u-text-red" style="transition: color 0.2s;" data-delete-user="${user.id}">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Setup action buttons
  setupUserActions();
}

function getRoleBadge(role: UserRole): string {
  const badges: Record<UserRole, string> = {
    patient: "badge badge--info",
    health_professional: "badge badge--success",
    receptionist: "badge badge--warning",
    lab_tech: "badge badge--warning",
    clinic_admin: "badge badge--error", // Using error color for admin specific distinction or neutral
    system_admin: "badge badge--error",
  };
  return badges[role] || "badge badge--neutral";
}

function getRoleDisplay(role: UserRole): string {
  const displays: Record<UserRole, string> = {
    patient: "PACIENTE",
    health_professional: "MÉDICO",
    receptionist: "RECEPÇÃO",
    lab_tech: "LABORATÓRIO",
    clinic_admin: "ADMIN CLÍNICA",
    system_admin: "ADMIN SISTEMA",
  };
  return displays[role] || role.toUpperCase();
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updatePagination(pagination: {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const paginationContainer = document.querySelector("[data-pagination]");
  if (!paginationContainer) return;

  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  paginationContainer.innerHTML = `
    <div class="pagination">
      <div class="pagination__info">
        Mostrando ${startItem} a ${endItem} de ${pagination.total} usuários
      </div>
      <div class="pagination__controls">
        <button
          class="pagination__button"
          data-prev-page
          ${pagination.page <= 1 ? "disabled" : ""}
        >
          Anterior
        </button>
        <span class="pagination__page">
          Página ${pagination.page} de ${pagination.totalPages}
        </span>
        <button
          class="pagination__button"
          data-next-page
          ${pagination.page >= pagination.totalPages ? "disabled" : ""}
        >
          Próxima
        </button>
      </div>
    </div>
  `;

  // Setup pagination buttons
  const prevBtn = paginationContainer.querySelector("[data-prev-page]");
  const nextBtn = paginationContainer.querySelector("[data-next-page]");

  if (prevBtn) {
    prevBtn.addEventListener("click", async () => {
      if (currentPage > 1) {
        currentPage--;
        await loadUsers();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      if (currentPage < pagination.totalPages) {
        currentPage++;
        await loadUsers();
      }
    });
  }
}

function setupUserActions() {
  // Edit buttons
  document.querySelectorAll("[data-edit-user]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const userId = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-edit-user") || "0",
      );
      if (userId) {
        await showEditModal(userId);
      }
    });
  });

  // Delete buttons
  document.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const userId = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-delete-user") ||
          "0",
      );
      if (userId) {
        await handleDeleteUser(userId);
      }
    });
  });
}

async function showEditModal(userId: number) {
  try {
    const response = await getUserById(userId);

    if (!response.success || !response.data) {
      uiStore.addToast(
        "error",
        response.error?.message || "Erro ao carregar dados do usuário",
      );
      return;
    }

    const user = response.data;
    const modalHtml = `
      <div class="modal-overlay" data-edit-modal style="z-index: 50;">
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">Editar Usuário</h3>
            <button class="modal__close" data-close-modal>
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="modal__content">
            <form data-edit-form class="form">
              <div class="form__group">
                <label class="form__label">Nome</label>
                <input
                  type="text"
                  name="name"
                  value="${escapeHtml(user.name)}"
                  class="input"
                  required
                />
              </div>

              <div class="form__group">
                <label class="form__label">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value="${escapeHtml(user.email)}"
                  class="input"
                  required
                />
              </div>

              <div class="form__group">
                <label class="form__label">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value="${escapeHtml(user.phone || "")}"
                  class="input"
                />
              </div>

              ${
                user.role === "health_professional" && user.professional_details
                  ? `
                <div class="form__group">
                  <label class="form__label">Especialidade</label>
                  <input
                    type="text"
                    name="specialty"
                    value="${escapeHtml(user.professional_details.specialty)}"
                    class="input"
                  />
                </div>

                <div class="form__group">
                  <label class="form__label">Número de Registro</label>
                  <input
                    type="text"
                    name="registration_number"
                    value="${escapeHtml(user.professional_details.registration_number)}"
                    class="input"
                  />
                </div>

                <div class="form__group">
                  <label class="form__label">Conselho</label>
                  <input
                    type="text"
                    name="council"
                    value="${escapeHtml(user.professional_details.council)}"
                    class="input"
                  />
                </div>

                <div class="form__group">
                    <label class="form__label">Preço da Consulta (R$)</label>
                    <input
                      type="number"
                      name="consultation_price"
                      value="${user.professional_details.consultation_price}"
                      step="0.01"
                      min="0"
                      class="input"
                    />
                </div>
              `
                  : ""
              }

              <div class="modal__footer" style="padding: 0; border: none; background: transparent; margin-top: 1rem;">
                <button type="button" data-close-modal class="btn btn--outline" style="flex: 1;">
                  Cancelar
                </button>
                <button type="submit" class="btn btn--primary" style="flex: 1;">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.querySelector("[data-edit-modal]");
    const form = modal?.querySelector("[data-edit-form]") as HTMLFormElement;

    // Close modal listeners
    modal?.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // Form submit
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const payload: UpdateUserPayload = {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: (formData.get("phone") as string) || undefined,
        };

        // Add professional fields if applicable
        if (user.role === "health_professional") {
          const specialty = formData.get("specialty") as string;
          const registrationNumber = formData.get(
            "registration_number",
          ) as string;
          const council = formData.get("council") as string;
          const consultationPrice = formData.get(
            "consultation_price",
          ) as string;

          if (specialty) payload.specialty = specialty;
          if (registrationNumber)
            payload.registration_number = registrationNumber;
          if (council) payload.council = council;
          if (consultationPrice)
            payload.consultation_price = parseFloat(consultationPrice);
        }

        const submitBtn = form.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        submitBtn.disabled = true;
        submitBtn.textContent = "Salvando...";

        const updateResponse = await updateUser(userId, payload);

        if (updateResponse.success) {
          uiStore.addToast("success", "Usuário atualizado com sucesso");
          modal?.remove();
          await loadUsers();
        } else {
          const errorMessage = getUserErrorMessage(
            updateResponse.error?.code || "UNKNOWN_ERROR",
          );
          uiStore.addToast("error", errorMessage);
          submitBtn.disabled = false;
          submitBtn.textContent = "Salvar";
        }
      });
    }
  } catch (error) {
    console.error("Error showing edit modal:", error);
    uiStore.addToast("error", "Erro ao abrir modal de edição");
  }
}

async function handleDeleteUser(userId: number) {
  const confirmed = confirm(
    "Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.",
  );

  if (!confirmed) return;

  try {
    const response = await deleteUser(userId);

    if (response.success) {
      uiStore.addToast("success", "Usuário deletado com sucesso");
      await loadUsers();
    } else {
      const errorMessage = getUserErrorMessage(
        response.error?.code || "UNKNOWN_ERROR",
      );
      uiStore.addToast("error", errorMessage);
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    uiStore.addToast("error", "Erro ao deletar usuário");
  }
}

function getUserErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    USER_NOT_FOUND: "Usuário não encontrado",
    EMAIL_ALREADY_EXISTS: "Este e-mail já está em uso",
    FORBIDDEN: "Você não tem permissão para realizar esta ação",
    USER_HAS_PENDING_RECORDS:
      "Não é possível deletar usuário com registros pendentes (agendamentos, exames, etc.)",
    UNAUTHORIZED: "Sessão expirada. Faça login novamente",
    UNKNOWN_ERROR: "Erro ao processar solicitação",
  };
  return messages[code] || "Erro desconhecido";
}

// Initialize page when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUsersPage);
} else {
  initUsersPage();
}
