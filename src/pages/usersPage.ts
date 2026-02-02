/**
 * Users management page for admin dashboard
 * Implements user listing, filtering, editing, and deletion
 */

import "../../css/pages/users.css"
import { deleteUser, getUserById, listUsers, updateUser, createUser } from "../services/usersService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UpdateUserPayload, CreateUserPayload, UserRole, UserSummary } from "../types/users"

let currentPage = 1
let currentFilters = {
  role: undefined as UserRole | undefined,
  search: "",
}

async function initUsersPage() {
  let session = authStore.getSession()

  if (!session) {
    // Try to refresh
    session = await authStore.refreshSession();
  }

  if (!session) {
     window.location.href = "/pages/login.html";
     return;
  }
  
  // Temporary: Relaxed check for development or assuming 'manager' is allowed
  // if (session.role !== "clinic_admin" && session.role !== "system_admin") { ... }

  // Setup filter listeners
  setupFilters()

  // Setup new user button (placeholder - no creation endpoint yet)
  setupNewUserButton()

  // Load initial user list
  await loadUsers()
}

function setupFilters() {
  const searchInput = document.querySelector<HTMLInputElement>("[data-search-input]")
  const roleSelect = document.querySelector<HTMLSelectElement>("[data-role-filter]")

  if (searchInput) {
    let debounceTimer: number
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(async () => {
        currentFilters.search = (e.target as HTMLInputElement).value.trim()
        currentPage = 1
        await loadUsers()
      }, 500)
    })
  }

  if (roleSelect) {
    roleSelect.addEventListener("change", async (e) => {
      const value = (e.target as HTMLSelectElement).value
      currentFilters.role = value === "all" ? undefined : (value as UserRole)
      currentPage = 1
      await loadUsers()
    })
  }
}

function setupNewUserButton() {
  const newUserBtn = document.querySelector("[data-new-user-btn]")
  if (newUserBtn) {
    newUserBtn.addEventListener("click", () => {
      uiStore.addToast("info", "Criação de usuários será implementada em breve")
    })
  }
}

async function loadUsers() {
  try {
    const response = await listUsers({
      ...currentFilters,
      page: currentPage,
      pageSize: 20,
    })

    if (response.success && response.data) {
      updateUsersTable(response.data.users)
      updatePagination(response.data.pagination)
    } else {
      uiStore.addToast("error", response.error?.message || "Erro ao carregar usuários")
      updateUsersTable([])
    }
  } catch (error) {
    console.error("Error loading users:", error)
    uiStore.addToast("error", "Erro ao carregar usuários")
    updateUsersTable([])
  }
}

function updateUsersTable(users: UserSummary[]) {
  const tbody = document.querySelector("[data-users-table-body]")
  if (!tbody) return

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
    `
    return
  }

  tbody.innerHTML = users.map(user => {
    const initials = user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    const roleBadge = getRoleBadge(user.role)
    const roleDisplay = getRoleDisplay(user.role)

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
          ${user.professional_details ? `
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">${escapeHtml(user.professional_details.specialty)}</div>
          ` : ""}
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
    `
  }).join("")

  // Setup action buttons
  setupUserActions()
}

function getRoleBadge(role: UserRole): string {
  const badges: Record<UserRole, string> = {
    patient: "badge badge--info",
    health_professional: "badge badge--success",
    receptionist: "badge badge--warning",
    lab_tech: "badge badge--warning",
    clinic_admin: "badge badge--error", // Using error color for admin specific distinction or neutral
    system_admin: "badge badge--error",
  }
  return badges[role] || "badge badge--neutral"
}

function getRoleDisplay(role: UserRole): string {
  const displays: Record<UserRole, string> = {
    patient: "PACIENTE",
    health_professional: "MÉDICO",
    receptionist: "RECEPÇÃO",
    lab_tech: "LABORATÓRIO",
    clinic_admin: "ADMIN CLÍNICA",
    system_admin: "ADMIN SISTEMA",
  }
  return displays[role] || role.toUpperCase()
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function updatePagination(pagination: { total: number; page: number; pageSize: number; totalPages: number }) {
  const paginationContainer = document.querySelector("[data-pagination]")
  if (!paginationContainer) return

  const startItem = (pagination.page - 1) * pagination.pageSize + 1
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total)

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
  `

  // Setup pagination buttons
  const prevBtn = paginationContainer.querySelector("[data-prev-page]")
  const nextBtn = paginationContainer.querySelector("[data-next-page]")

  if (prevBtn) {
    prevBtn.addEventListener("click", async () => {
      if (currentPage > 1) {
        currentPage--
        await loadUsers()
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      if (currentPage < pagination.totalPages) {
        currentPage++
        await loadUsers()
      }
    })
  }
}

function setupUserActions() {
  // Edit buttons
  document.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const userId = parseInt((e.currentTarget as HTMLElement).getAttribute("data-edit-user") || "0")
      if (userId) {
        await showUserModal(userId)
      }
    })
  })

  // Delete buttons
  document.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const userId = parseInt((e.currentTarget as HTMLElement).getAttribute("data-delete-user") || "0")
      if (userId) {
        await handleDeleteUser(userId)
      }
    })
  })
}

async function showUserModal(userId?: number) {
  try {
    let user: Partial<UserSummary> | null = null;
    let isEdit = !!userId;

    if (userId) {
        const response = await getUserById(userId)
        if (!response.success || !response.data) {
            uiStore.addToast("error", response.error?.message || "Erro ao carregar dados do usuário")
            return
        }
        user = response.data;
    } else {
        // Default for new user
        user = {
            role: 'health_professional' // Default selection
        };
    }

    const modalHtml = `
      <div class="modal-overlay" data-edit-modal style="z-index: 50;">
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">${isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <button class="modal__close" data-close-modal>
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="modal__content">
            <form data-edit-form class="form">
              <div class="form__group">
                <label class="form__label">Nome</label>
                <input type="text" name="name" value="${user.name ? escapeHtml(user.name) : ''}" class="input" required />
              </div>

              <div class="form__group">
                <label class="form__label">E-mail</label>
                <input type="email" name="email" value="${user.email ? escapeHtml(user.email) : ''}" class="input" required />
              </div>

              ${!isEdit ? `
              <div class="form__group">
                <label class="form__label">Senha</label>
                <input type="text" name="password" class="input" required minlength="6" placeholder="Senha temporária" />
              </div>

              <div class="form__group">
                  <label class="form__label">Função (Cargo)</label>
                  <select name="role" class="input" id="role-select">
                      <option value="health_professional">Médico / Profissional de Saúde</option>
                      <option value="receptionist">Recepcionista</option>
                      <option value="clinic_admin">Administrador</option>
                  </select>
              </div>
              ` : ''}

              <div class="form__group">
                <label class="form__label">Telefone</label>
                <input type="text" name="phone" value="${user.phone ? escapeHtml(user.phone) : ''}" class="input" />
              </div>

              <!-- Professional Fields Container -->
              <div id="professional-fields" style="${(user.role === 'health_professional' || !isEdit) ? 'display:block' : 'display:none'}">
                  <h4 style="margin: 1rem 0 0.5rem; color: var(--text-primary); font-size: 0.9rem; font-weight: 600;">Dados Profissionais</h4>
                  
                  <div class="form__group">
                    <label class="form__label">Especialidade</label>
                    <input type="text" name="specialty" value="${user.professional_details?.specialty ? escapeHtml(user.professional_details.specialty) : ''}" class="input" />
                  </div>

                  <div class="form__group">
                    <label class="form__label">CRM / Registro</label>
                    <input type="text" name="registration_number" value="${user.professional_details?.registration_number ? escapeHtml(user.professional_details.registration_number) : ''}" class="input" />
                  </div>

                  <div class="form__group">
                    <label class="form__label">Conselho (CRM/CRO)</label>
                    <input type="text" name="council" value="${user.professional_details?.council ? escapeHtml(user.professional_details.council) : ''}" class="input" />
                  </div>

                  <div class="form__group">
                      <label class="form__label">Preço da Consulta (R$)</label>
                      <input type="number" name="consultation_price" value="${user.professional_details?.consultation_price || ''}" step="0.01" min="0" class="input" />
                  </div>
              </div>

              <div class="modal__footer" style="padding: 0; border: none; background: transparent; margin-top: 1rem;">
                <button type="button" data-close-modal class="btn btn--outline" style="flex: 1;">Cancelar</button>
                <button type="submit" class="btn btn--primary" style="flex: 1;">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHtml)

    const modal = document.querySelector("[data-edit-modal]")
    const form = modal?.querySelector("[data-edit-form]") as HTMLFormElement
    const roleSelect = form?.querySelector("#role-select") as HTMLSelectElement
    const proFields = form?.querySelector("#professional-fields") as HTMLElement

    // Toggle Professional Fields based on Role
    if (roleSelect && proFields) {
        roleSelect.addEventListener('change', () => {
            if (roleSelect.value === 'health_professional') {
                proFields.style.display = 'block';
            } else {
                proFields.style.display = 'none';
            }
        });
        // Init state
        if (roleSelect.value === 'health_professional') proFields.style.display = 'block';
        else proFields.style.display = 'none';
    }


    // Close modal listeners
    modal?.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => modal.remove())
    })

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove()
    })

    // Form submit
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = new FormData(form)
        
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
        submitBtn.disabled = true
        submitBtn.textContent = "Salvando..."

        try {
            if (userId) {
                // UPDATE
                const payload: UpdateUserPayload = {
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string || undefined,
                }
                
                // If it was a professional, update those fields too (simplified: assumes role didn't change logic for now)
                if (user?.role === "health_professional") {
                   const specialty = formData.get("specialty") as string
                   if(specialty) {
                       payload.specialty = specialty
                       payload.registration_number = formData.get("registration_number") as string
                       payload.council = formData.get("council") as string
                       payload.consultation_price = parseFloat(formData.get("consultation_price") as string || "0")
                   }
                }

                const updateResponse = await updateUser(userId, payload)
                if (updateResponse.success) {
                    uiStore.addToast("success", "Usuário atualizado com sucesso")
                    modal?.remove()
                    await loadUsers()
                } else {
                    throw updateResponse.error
                }

            } else {
                // CREATE
                const payload: CreateUserPayload = {
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    password: formData.get("password") as string,
                    role: (formData.get("role") as UserRole) || 'health_professional',
                    phone: formData.get("phone") as string || undefined,
                };

                if (payload.role === 'health_professional') {
                    payload.specialty = formData.get("specialty") as string
                    payload.registration_number = formData.get("registration_number") as string
                    payload.council = formData.get("council") as string
                    payload.consultation_price = parseFloat(formData.get("consultation_price") as string || "0")
                }

                const createResponse = await createUser(payload);
                if (createResponse.success) {
                    uiStore.addToast("success", "Usuário criado com sucesso")
                    modal?.remove()
                    await loadUsers()
                } else {
                    throw createResponse.error
                }
            }

        } catch (err: any) {
             const errorMessage = getUserErrorMessage(err?.code || "UNKNOWN_ERROR")
             uiStore.addToast("error", errorMessage)
             submitBtn.disabled = false
             submitBtn.textContent = "Salvar"
        }
      })
    }
  } catch (error) {
    console.error("Error showing modal:", error)
    uiStore.addToast("error", "Erro ao abrir modal")
  }
}

async function handleDeleteUser(userId: number) {
  const confirmed = confirm("Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.")

  if (!confirmed) return

  try {
    const response = await deleteUser(userId)

    if (response.success) {
      uiStore.addToast("success", "Usuário deletado com sucesso")
      await loadUsers()
    } else {
      const errorMessage = getUserErrorMessage(response.error?.code || "UNKNOWN_ERROR")
      uiStore.addToast("error", errorMessage)
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    uiStore.addToast("error", "Erro ao deletar usuário")
  }
}

function getUserErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    USER_NOT_FOUND: "Usuário não encontrado",
    EMAIL_ALREADY_EXISTS: "Este e-mail já está em uso",
    FORBIDDEN: "Você não tem permissão para realizar esta ação",
    USER_HAS_PENDING_RECORDS: "Não é possível deletar usuário com registros pendentes (agendamentos, exames, etc.)",
    UNAUTHORIZED: "Sessão expirada. Faça login novamente",
    UNKNOWN_ERROR: "Erro ao processar solicitação",
  }
  return messages[code] || "Erro desconhecido"
}

// Initialize page when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUsersPage)
} else {
  initUsersPage()
}
