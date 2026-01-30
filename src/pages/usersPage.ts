/**
 * Users management page for admin dashboard
 * Implements user listing, filtering, editing, and deletion
 */

import { deleteUser, getUserById, listUsers, updateUser } from "../services/usersService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UpdateUserPayload, UserRole, UserSummary } from "../types/users"

let currentPage = 1
let currentFilters = {
  role: undefined as UserRole | undefined,
  search: "",
}

async function initUsersPage() {
  const session = authStore.getSession()

  if (!session || (session.role !== "clinic_admin" && session.role !== "system_admin")) {
    uiStore.addToast("error", "Acesso negado. Apenas administradores podem acessar esta página.")
    window.location.href = "/pages/login.html"
    return
  }

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
        <td colspan="5" class="px-6 py-12 text-center text-slate-400">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-4xl">search_off</span>
            <p>Nenhum usuário encontrado</p>
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
      <tr class="hover:bg-border-dark/10 transition-colors" data-user-id="${user.id}">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              ${initials}
            </div>
            <div>
              <p class="text-sm font-bold">${escapeHtml(user.name)}</p>
              <p class="text-[10px] text-slate-500">ID: #${user.id}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-slate-400">${escapeHtml(user.email)}</td>
        <td class="px-6 py-4 text-sm">
          <span class="px-2 py-1 rounded ${roleBadge} text-[10px] font-bold">${roleDisplay}</span>
          ${user.professional_details ? `
            <div class="text-[10px] text-slate-500 mt-1">${escapeHtml(user.professional_details.specialty)}</div>
          ` : ""}
        </td>
        <td class="px-6 py-4">
          <span class="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <span class="size-1.5 rounded-full bg-emerald-500"></span> Ativo
          </span>
        </td>
        <td class="px-6 py-4 text-right">
          <button class="text-slate-500 hover:text-white transition-colors mr-2" data-edit-user="${user.id}">
            <span class="material-symbols-outlined">edit_square</span>
          </button>
          <button class="text-slate-500 hover:text-red-400 transition-colors" data-delete-user="${user.id}">
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
    patient: "bg-blue-500/10 text-blue-400",
    health_professional: "bg-emerald-500/10 text-emerald-400",
    receptionist: "bg-purple-500/10 text-purple-400",
    lab_tech: "bg-yellow-500/10 text-yellow-400",
    clinic_admin: "bg-orange-500/10 text-orange-400",
    system_admin: "bg-red-500/10 text-red-400",
  }
  return badges[role] || "bg-slate-500/10 text-slate-400"
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
    <div class="flex items-center justify-between mt-4 px-6 py-4 bg-surface-dark border-t border-border-dark">
      <div class="text-sm text-slate-400">
        Mostrando ${startItem} a ${endItem} de ${pagination.total} usuários
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 rounded bg-border-dark text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors"
          data-prev-page
          ${pagination.page <= 1 ? "disabled" : ""}
        >
          Anterior
        </button>
        <span class="px-3 py-1 text-sm text-slate-400">
          Página ${pagination.page} de ${pagination.totalPages}
        </span>
        <button
          class="px-3 py-1 rounded bg-border-dark text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors"
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
        await showEditModal(userId)
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

async function showEditModal(userId: number) {
  try {
    const response = await getUserById(userId)

    if (!response.success || !response.data) {
      uiStore.addToast("error", response.error?.message || "Erro ao carregar dados do usuário")
      return
    }

    const user = response.data
    const modalHtml = `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-edit-modal>
        <div class="bg-surface-dark border border-border-dark rounded-2xl p-6 max-w-md w-full mx-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold">Editar Usuário</h3>
            <button class="text-slate-400 hover:text-white" data-close-modal>
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form data-edit-form class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                name="name"
                value="${escapeHtml(user.name)}"
                class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                value="${escapeHtml(user.email)}"
                class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="text"
                name="phone"
                value="${escapeHtml(user.phone || "")}"
                class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            ${user.role === "health_professional" && user.professional_details ? `
              <div>
                <label class="block text-sm font-medium mb-1">Especialidade</label>
                <input
                  type="text"
                  name="specialty"
                  value="${escapeHtml(user.professional_details.specialty)}"
                  class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Número de Registro</label>
                <input
                  type="text"
                  name="registration_number"
                  value="${escapeHtml(user.professional_details.registration_number)}"
                  class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Conselho</label>
                <input
                  type="text"
                  name="council"
                  value="${escapeHtml(user.professional_details.council)}"
                  class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Preço da Consulta (R$)</label>
                <input
                  type="number"
                  name="consultation_price"
                  value="${user.professional_details.consultation_price}"
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            ` : ""}

            <div class="flex gap-3 pt-4">
              <button type="button" data-close-modal class="flex-1 px-4 py-2 bg-border-dark rounded-lg hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button type="submit" class="flex-1 px-4 py-2 bg-primary rounded-lg hover:bg-blue-600 transition-colors font-bold">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHtml)

    const modal = document.querySelector("[data-edit-modal]")
    const form = modal?.querySelector("[data-edit-form]") as HTMLFormElement

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
        const payload: UpdateUserPayload = {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string || undefined,
        }

        // Add professional fields if applicable
        if (user.role === "health_professional") {
          const specialty = formData.get("specialty") as string
          const registrationNumber = formData.get("registration_number") as string
          const council = formData.get("council") as string
          const consultationPrice = formData.get("consultation_price") as string

          if (specialty) payload.specialty = specialty
          if (registrationNumber) payload.registration_number = registrationNumber
          if (council) payload.council = council
          if (consultationPrice) payload.consultation_price = parseFloat(consultationPrice)
        }

        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
        submitBtn.disabled = true
        submitBtn.textContent = "Salvando..."

        const updateResponse = await updateUser(userId, payload)

        if (updateResponse.success) {
          uiStore.addToast("success", "Usuário atualizado com sucesso")
          modal?.remove()
          await loadUsers()
        } else {
          const errorMessage = getUserErrorMessage(updateResponse.error?.code || "UNKNOWN_ERROR")
          uiStore.addToast("error", errorMessage)
          submitBtn.disabled = false
          submitBtn.textContent = "Salvar"
        }
      })
    }
  } catch (error) {
    console.error("Error showing edit modal:", error)
    uiStore.addToast("error", "Erro ao abrir modal de edição")
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
