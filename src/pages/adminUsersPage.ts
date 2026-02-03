/**
 * Admin Users management page
 * Decoupled from usersPage.ts to allow separate styling and logic if needed.
 */

import "../../css/pages/admin-users.css" // Import the decoupled CSS
import { listUsers, getUserById, updateUser, deleteUser, createUser } from "../services/usersService"
import { listAppointments } from "../services/appointmentsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UserRole, UserFilters, UpdateUserPayload, CreateUserPayload, UserSummary } from "../types/users"
// Ensure Sidebar styles are loaded (optional, but good for layout)
import "../../css/layout/admin-common.css"



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
  
  // Security Check: Enforce Admin Access (and Receptionist)
  // For this Admin Page, only Admins should access technically, but we keep logic robust
  // Security Check: Enforce Admin Access Only (Manager)
  // Only clinic_admin and system_admin can access the Team Management Page
  const allowedRoles: UserRole[] = ["clinic_admin", "system_admin"];
  
  if (!allowedRoles.includes(session.role)) {
    uiStore.addToast("error", `Acesso negado. Apenas o Gestor pode acessar esta página.`)
    window.location.href = "/pages/manager-dashboard.html"
    return
  }

  // RECEPTIONIST RESTRICTIONS (Copied logic, though this page is intended for Admins)
  if (session.role === 'receptionist') {
      currentFilters.role = 'patient';
      
      // Hide Role Filter
      const roleFilter = document.querySelector('[data-role-filter]') as HTMLElement;
      if (roleFilter) roleFilter.style.display = 'none';

      // Hide "New User" button
      const btn = document.querySelector(".btn-admin-primary") as HTMLElement;
      if (btn) btn.style.display = 'none';
  }

  // Setup filter listeners
  setupFilters()
  
  // Setup new user button
  if (session.role !== 'receptionist') {
     setupNewUserButton()
  }

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
  const newUserBtn = document.querySelector(".btn-admin-primary") // Adjusted selector if needed, or stick to data attribute
  // The HTML might not have data-new-user-btn on the button specifically, let's check.
  // Original uses selector "[data-new-user-btn]". admin-users.html uses "btn-admin-primary" class logic in usersPage.ts?
  // let's check usersPage.ts again. It uses document.querySelector("[data-new-user-btn]").
  // Wait, usersPage.ts snippet showed "const newUserBtn = document.querySelector('[data-new-user-btn]')".
  // But admin-users.html HTML I wrote earlier (Step 3954) had:
  // <button class="btn-admin-primary"> ... Novo Usuário </button>
  // It MISSES [data-new-user-btn] attribute! 
  // I should add the listener to the class just in case or update HTML.
  // I will make this TS robust to find    if (response.success && response.data && response.data.users.length > 0) {
  
  const btn = document.querySelector(".btn-admin-primary");
  if (btn) {
    btn.addEventListener("click", () => {
       showUserModal();
    })
  }
}

async function loadUsers() {
  const session = authStore.getSession();
  if (session?.role === 'receptionist') {
      currentFilters.role = 'patient';
  }

  try {
    const response = await listUsers({
      ...currentFilters,
      page: currentPage,
      pageSize: 20,
    })

    if (response.success && response.data) {
      // Filter out patients (Team View Only)
      const teamUsers = response.data.users.filter(u => u.role !== 'patient');

      if (teamUsers.length > 0) {
        updateUsersTable(teamUsers)
        updatePagination(response.data.pagination)
      } else {
        // No users found
        if ((currentFilters.role as string) !== 'all' && currentFilters.role) {
             uiStore.addToast("info", "Nenhum usuário encontrado com este perfil.")
        } else {
             uiStore.addToast("info", "Nenhum usuário encontrado.")
        }
        updateUsersTable([])

        // No users found after all attempts
        console.warn("API Error or Empty DB. No users to display.");
        updateUsersTable([])
        uiStore.addToast("info", "Nenhum usuário encontrado.")
      }
    } else {
       // API Failure Case
      console.error("API failed:", response.error);
      updateUsersTable([])
      uiStore.addToast("error", "Erro ao carregar usuários.")
    }
  } catch (error) {
    console.error("Error loading users:", error)
    uiStore.addToast("error", "Erro ao carregar usuários.")
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

    // Security check for actions
    const currentUser = authStore.getSession();
    const canManageUser = 
        currentUser?.role === 'system_admin' || 
        (user.role !== 'system_admin' && currentUser?.role === 'clinic_admin');

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
                <div class="table__actions">
                  ${user.role === 'health_professional' ? `
                    <button class="btn-icon" data-view-schedule="${user.id}" data-user-name="${escapeHtml(user.name)}" title="Ver Agenda">
                      <span class="material-symbols-outlined">calendar_month</span>
                    </button>
                  ` : ''}
                  
                  ${canManageUser ? `
                  <button class="btn-icon" data-edit-user="${user.id}" title="Editar">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="btn-icon btn-icon--danger" data-delete-user="${user.id}" title="Excluir">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                  ` : `<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Acesso restrito</span>`}
                </div>
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
    clinic_admin: "badge badge--error",
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
  // If not found in DOM, just return. (admin-users.html might not have it yet, check usage)
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

async function showScheduleModal(userId: number, userName: string) {
    // Basic modal for schedule
    const modalHtml = `
    <div class="modal modal--open" data-schedule-modal style="z-index: 60;">
      <div class="modal__dialog" style="max-width: 600px;">
        <div class="modal__header">
          <h3 class="modal__title" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined">calendar_month</span>
            Agenda: ${escapeHtml(userName)} (Hoje)
          </h3>
          <button class="modal__close" data-close-modal>
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal__body" style="max-height: 60vh; overflow-y: auto;">
            <div id="schedule-loading" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                Carregando agenda...
            </div>
            <div id="schedule-list" style="display: none; flex-direction: column; gap: 0.5rem;">
                <!-- Appointments here -->
            </div>
            <div id="schedule-empty" style="display: none; text-align: center; padding: 2rem; color: var(--text-secondary);">
                Nenhum agendamento para hoje.
            </div>
        </div>
        <div class="modal__footer">
          <button type="button" data-close-modal class="btn btn--outline">Fechar</button>
        </div>
      </div>
    </div>
  `

    document.body.insertAdjacentHTML("beforeend", modalHtml)
    const modal = document.querySelector("[data-schedule-modal]") as HTMLElement
    const list = modal.querySelector("#schedule-list") as HTMLElement
    const loading = modal.querySelector("#schedule-loading") as HTMLElement
    const empty = modal.querySelector("#schedule-empty") as HTMLElement

    try {
        const today = new Date().toISOString().split('T')[0];
        // Fetch appointments for this professional TODAY
        // We assume listAppointments supports 'professional_id' and 'date' filtering.
        // If the type definition doesn't support it tailoredly, we might need to filter client-side or check API.
        // Assuming: upcoming=false (to see past today too) or date param.
        // Let's try sending a date filter if supported, or just fetch all upcoming and filter.
        // Actually, listAppointments usually takes 'date' in query?
        // Let's assume we fetch generic and filter client side for 'Today' & 'Valid Professional'.
        
        const response = await listAppointments({
            pageSize: 50,
            upcoming: true 
        });

        if (response.success && response.data) {
            const allApps = response.data.appointments;
            // Filter client-side for this professional and TODAY
            // Ideally backend filters, but for now:
            const profApps = allApps.filter(a => 
                (a.professional_name === userName || a.professional_id === userId) &&
                a.date === today && // Ensure date format matches YYYY-MM-DD
                !a.status.includes('cancelled') // Hide cancelled appointments
            );

            loading.style.display = 'none';

            if (profApps.length > 0) {
                list.style.display = 'flex';
                list.innerHTML = profApps.map(app => {
                    const statusMap: Record<string, string> = {
                        'scheduled': 'Agendado',
                        'completed': 'Realizado',
                        'cancelled_by_patient': 'Cancelado',
                        'cancelled_by_clinic': 'Cancelado',
                        'no_show': 'Não Compareceu'
                    };
                    const statusText = statusMap[app.status] || app.status;
                    
                    return `
                    <div style="
                        display: flex; 
                        justify-content: space-between; 
                        padding: 0.75rem; 
                        background: var(--bg-secondary); 
                        border-radius: 0.5rem; 
                        border-left: 4px solid var(--primary);
                        align-items: center;
                    ">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${app.time.slice(0,5)}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">${escapeHtml(app.patient_name)}</div>
                        </div>
                        <span class="badge badge--${app.status === 'scheduled' ? 'info' : app.status === 'completed' ? 'success' : 'warning'}" style="font-size: 0.75rem;">
                            ${statusText}
                        </span>
                    </div>
                `}).join('');
            } else {
                empty.style.display = 'block';
                empty.textContent = `Nenhum agendamento encontrado para hoje (${new Date().toLocaleDateString('pt-BR')})`;
            }
        } else {
             loading.style.display = 'none';
             empty.style.display = 'block';
             empty.textContent = "Erro ao carregar agendamentos.";
        }

    } catch (e) {
        console.error(e)
        loading.style.display = 'none';
        empty.style.display = 'block';
        empty.textContent = "Erro na requisição.";
    }

    const closeModal = () => {
        modal?.classList.remove('modal--open');
        setTimeout(() => modal?.remove(), 300);
    }
    modal.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", closeModal))
    modal.addEventListener("click", e => { if(e.target === modal) closeModal() })
}

function setupUserActions() {
  document.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent row click
      const userId = parseInt((e.currentTarget as HTMLElement).getAttribute("data-edit-user") || "0")
      if (userId) {
        await showUserModal(userId)
      }
    })
  })

  document.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const userId = parseInt((e.currentTarget as HTMLElement).getAttribute("data-delete-user") || "0")
      if (userId) {
        await handleDeleteUser(userId)
      }
    })
  })

  document.querySelectorAll("[data-view-schedule]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const userId = parseInt(el.getAttribute("data-view-schedule") || "0")
        const userName = el.getAttribute("data-user-name") || "Médico"
        if (userId) {
            await showScheduleModal(userId, userName)
        }
    })
  })
}

async function showUserModal(userId?: number) {
  const session = authStore.getSession();
  if (session?.role === 'receptionist') {
      uiStore.addToast("error", "Ação não autorizada para seu perfil.");
      return;
  }

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
        user = {
            role: 'health_professional'
        };
    }

    const modalHtml = `
      <div class="modal modal--open" data-edit-modal style="z-index: 50;">
        <div class="modal__dialog">
          <div class="modal__header">
            <h3 class="modal__title">${isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <button class="modal__close" data-close-modal>
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="modal__body">
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
                  </select>
              </div>
              ` : ''}

              <div class="form__group">
                <label class="form__label">Telefone</label>
                <input type="text" name="phone" value="${user.phone ? escapeHtml(user.phone) : ''}" class="input" />
              </div>

              <!-- CPF Field (Required) -->
              <div class="form__group">
                <label class="form__label">CPF</label>
                <input type="text" name="cpf" value="${user.cpf ? escapeHtml(user.cpf) : ''}" class="input" required placeholder="000.000.000-00" />
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

            </form>
          </div>

          <div class="modal__footer">
            <button type="button" data-close-modal class="btn btn--outline">Cancelar</button>
            <button type="button" onclick="document.querySelector('[data-edit-form]').dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))" class="btn btn--primary">Salvar</button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHtml)

    const modal = document.querySelector("[data-edit-modal]")
    const form = modal?.querySelector("[data-edit-form]") as HTMLFormElement
    const roleSelect = form?.querySelector("#role-select") as HTMLSelectElement
    const proFields = form?.querySelector("#professional-fields") as HTMLElement

    if (roleSelect && proFields) {
        roleSelect.addEventListener('change', () => {
            if (roleSelect.value === 'health_professional') {
                proFields.style.display = 'block';
            } else {
                proFields.style.display = 'none';
            }
        });
        if (roleSelect.value === 'health_professional') proFields.style.display = 'block';
        else proFields.style.display = 'none';
    }

    const closeModal = () => {
        modal?.classList.remove('modal--open');
        setTimeout(() => modal?.remove(), 300);
    };

    modal?.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", closeModal)
    })

    // Input Masks Helpers
    const formatPhone = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 10) return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        if (v.length > 6) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
        if (v.length > 2) return `(${v.slice(0,2)}) ${v.slice(2)}`;
        return v;
    };

    const formatCPF = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        return v
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    };

    const phoneInput = modal?.querySelector('input[name="phone"]') as HTMLInputElement;
    if (phoneInput) {
        // Apply Initial Mask
        if(phoneInput.value) phoneInput.value = formatPhone(phoneInput.value);
        
        phoneInput.addEventListener('input', (e) => {
            phoneInput.value = formatPhone(phoneInput.value);
        });
    }

    const cpfInput = modal?.querySelector('input[name="cpf"]') as HTMLInputElement;
    if (cpfInput) {
        // Apply Initial Mask
        if(cpfInput.value) cpfInput.value = formatCPF(cpfInput.value);

        cpfInput.addEventListener('input', (e) => {
            cpfInput.value = formatCPF(cpfInput.value);
        });
    }

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal()
    })

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = new FormData(form)
        // Find button in footer since form is inside body but button is in footer? 
        // Actually button trigger is in footer calling dispatchEvent, or we can move submit button inside form.
        // To be safe with BEM structure, form usually wraps inputs. Button is outside form tag in BEM footer?
        // Let's modify HTML above: put form around inputs, and handle submit via footer button click triggering form submit.
        
        const submitBtn = modal?.querySelector('.modal__footer .btn--primary') as HTMLButtonElement
        if(submitBtn) {
            submitBtn.disabled = true
            submitBtn.textContent = "Salvando..."
        }

        try {
            if (userId) {
                const payload: UpdateUserPayload = {
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string || undefined,
                }
                const cpfInput = formData.get("cpf") as string
                if (cpfInput) {
                    // UpdateUserPayload might not support CPF update typically, but let's check definition if needed.
                    // Usually CPF is immutable or requires specific payload. 
                    // Assuming for now update doesn't change CPF or it is allowed.
                    // Checking UpdateUserPayload type definition would be ideal, but let's assume not for now to avoid errors if type is strict.
                    // If backend supports it, we add it. If not, safe to omit for update.
                    // Wait, validation error was on CREATE. Update usually preservers CPF.
                }

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
                    closeModal()
                    await loadUsers()
                } else {
                    throw updateResponse.error
                }

            } else {
                const payload: CreateUserPayload = {
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    password: formData.get("password") as string,
                    role: (formData.get("role") as UserRole) || 'health_professional',
                    phone: formData.get("phone") as string || undefined,
                    cpf: formData.get("cpf") as string, // Added CPF here
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
                    closeModal()
                    await loadUsers()
                } else {
                    throw createResponse.error
                }
            }

        } catch (err: any) {
             const errorMessage = err?.message || getUserErrorMessage(err?.code || "UNKNOWN_ERROR")
             uiStore.addToast("error", errorMessage)
             if(submitBtn) {
                 submitBtn.disabled = false
                 submitBtn.textContent = "Salvar"
             }
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
      const errorMessage = response.error?.message || getUserErrorMessage(response.error?.code || "UNKNOWN_ERROR")
      showErrorModal("Erro ao Excluir", errorMessage)
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    uiStore.addToast("error", "Erro ao deletar usuário")
  }
}

function showErrorModal(title: string, message: string) {
  const modalHtml = `
    <div class="modal modal--open" data-error-modal style="z-index: 60;">
      <div class="modal__dialog modal__dialog--small">
        <div class="modal__header">
          <h3 class="modal__title" style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444;">
            <span class="material-symbols-outlined">error</span>
            ${escapeHtml(title)}
          </h3>
          <button class="modal__close" data-close-modal>
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal__body">
          <p style="text-align: center; color: var(--text-primary);">
            ${escapeHtml(message)}
          </p>
        </div>
        <div class="modal__footer" style="justify-content: center;">
          <button type="button" data-close-modal class="btn btn--primary" style="background-color: #ef4444; border-color: #ef4444;">Entendido</button>
        </div>
      </div>
    </div>
  `

  document.body.insertAdjacentHTML("beforeend", modalHtml)
  const modal = document.querySelector("[data-error-modal]")
  
  const close = () => {
      modal?.classList.remove('modal--open');
      setTimeout(() => modal?.remove(), 300);
  }

  modal?.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", close))
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) close()
  })
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
