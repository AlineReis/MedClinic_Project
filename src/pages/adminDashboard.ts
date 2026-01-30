import { listAppointments } from "../services/appointmentsService"
import { logout } from "../services/authService"
import { listProfessionals } from "../services/professionalsService"
import { listUsers } from "../services/usersService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"

interface DashboardStats {
  totalUsers: number
  totalAppointments: number
  totalProfessionals: number
  usersByRole: Record<string, number>
  appointmentsByStatus: Record<string, number>
}

let currentStats: DashboardStats = {
  totalUsers: 0,
  totalAppointments: 0,
  totalProfessionals: 0,
  usersByRole: {},
  appointmentsByStatus: {},
}


// não implementada:
// agenda
// checkout
// dashboard
// doctors
// exams
// financial
// manager-dashboard
// onboarding.html
// password-recovery
// pep
// prescription
// schedule-appointment.html
// slots
// telemedicine
// users






export async function initAdminDashboard() {
  const session = await authStore.refreshSession()

  if (!session) {
    window.location.href = "/pages/login.html"
    return
  }

  if (session.role !== "clinic_admin" && session.role !== "system_admin") {
    uiStore.addToast(
      "error",
      "Acesso negado. Apenas administradores podem acessar esta página.",
    )
    window.location.href = "/pages/login.html"
    return
  }

  setupUserProfile()
  setupLogoutButton()
  loadDashboardData()
}

function setupUserProfile() {
  const session = authStore.getSession()
  if (!session) return

  const profileName = document.querySelector('[data-profile-name]')
  const profileRole = document.querySelector('[data-profile-role]')
  const profileInitials = document.querySelector('[data-profile-initials]')

  if (profileName) profileName.textContent = session.name || "Admin"
  if (profileRole) profileRole.textContent = getRoleDisplay(session.role)
  if (profileInitials) {
    const initials = getInitials(session.name || "Admin")
    profileInitials.textContent = initials
  }
}

function setupLogoutButton() {
  const logoutBtn = document.querySelector('[data-logout-btn]')
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async e => {
      e.preventDefault()
      try {
        await logout()
        authStore.clearSession()
        window.location.href = "/pages/login.html"
      } catch (error) {
        console.error("Logout error:", error)
        authStore.clearSession()
        window.location.href = "/pages/login.html"
      }
    })
  }
}

async function loadDashboardData() {
  try {
    const [usersResponse, appointmentsResponse, professionalsResponse] =
      await Promise.all([
        listUsers({ pageSize: 1000 }),
        listAppointments({ pageSize: 1000 }),
        listProfessionals({ pageSize: 1000 }),
      ])

    if (usersResponse.success && usersResponse.data) {
      const users = usersResponse.data.users
      currentStats.totalUsers = users.length

      currentStats.usersByRole = users.reduce(
        (acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
    }

    if (
      appointmentsResponse.success &&
      appointmentsResponse.data &&
      "appointments" in appointmentsResponse.data
    ) {
      const appointments = appointmentsResponse.data.appointments
      currentStats.totalAppointments = appointments.length

      currentStats.appointmentsByStatus = appointments.reduce(
        (acc, appt) => {
          acc[appt.status] = (acc[appt.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
    }

    if (professionalsResponse.success && professionalsResponse.data) {
      currentStats.totalProfessionals = professionalsResponse.data.data.length
    }

    updateDashboardUI()
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    uiStore.addToast("error", "Erro ao carregar dados do dashboard")
  }
}

function updateDashboardUI() {
  updateStatsCards()
  updateUsersByRoleSection()
  updateAppointmentsByStatusSection()
}

function updateStatsCards() {
  const totalUsersEl = document.querySelector('[data-stat-total-users]')
  const totalAppointmentsEl = document.querySelector(
    '[data-stat-total-appointments]',
  )
  const totalProfessionalsEl = document.querySelector(
    '[data-stat-total-professionals]',
  )
  const totalRolesEl = document.querySelector('[data-stat-total-roles]')

  if (totalUsersEl) {
    totalUsersEl.textContent = currentStats.totalUsers.toString()
  }
  if (totalAppointmentsEl) {
    totalAppointmentsEl.textContent = currentStats.totalAppointments.toString()
  }
  if (totalProfessionalsEl) {
    totalProfessionalsEl.textContent =
      currentStats.totalProfessionals.toString()
  }
  if (totalRolesEl) {
    totalRolesEl.textContent = Object.keys(currentStats.usersByRole).length.toString()
  }
}

function updateUsersByRoleSection() {
  const container = document.querySelector('[data-users-by-role]')
  if (!container) return

  const roles = Object.entries(currentStats.usersByRole).sort(
    (a, b) => b[1] - a[1],
  )

  if (roles.length === 0) {
    container.innerHTML = `
      <div class="text-center text-slate-400 py-8">
        <span class="material-symbols-outlined text-4xl mb-2">people_outline</span>
        <p class="text-sm">Nenhum usuário cadastrado</p>
      </div>
    `
    return
  }

  container.innerHTML = roles
    .map(
      ([role, count]) => `
      <li class="flex items-center justify-between p-3 bg-background-dark/50 rounded-xl">
        <span class="text-sm">${getRoleDisplay(role)}</span>
        <span class="font-bold">${count}</span>
      </li>
    `,
    )
    .join("")
}

function updateAppointmentsByStatusSection() {
  const container = document.querySelector('[data-appointments-by-status]')
  if (!container) return

  const statuses = Object.entries(currentStats.appointmentsByStatus).sort(
    (a, b) => b[1] - a[1],
  )

  if (statuses.length === 0) {
    container.innerHTML = `
      <div class="text-center text-slate-400 py-8">
        <span class="material-symbols-outlined text-4xl mb-2">event_busy</span>
        <p class="text-sm">Nenhum agendamento encontrado</p>
      </div>
    `
    return
  }

  container.innerHTML = statuses
    .map(
      ([status, count]) => `
      <li class="flex items-center justify-between p-3 bg-background-dark/50 rounded-xl">
        <div class="flex items-center gap-2">
          <span class="text-sm">${getStatusDisplay(status)}</span>
          ${getStatusBadge(status)}
        </div>
        <span class="font-bold">${count}</span>
      </li>
    `,
    )
    .join("")
}

function getRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    patient: "Paciente",
    health_professional: "Profissional de Saúde",
    receptionist: "Recepcionista",
    lab_tech: "Técnico de Laboratório",
    clinic_admin: "Administrador da Clínica",
    system_admin: "Administrador do Sistema",
  }
  return roleMap[role] || role
}

function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    in_progress: "Em Andamento",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Ausente",
  }
  return statusMap[status] || status
}

function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    scheduled:
      '<span class="px-2 py-0.5 text-[10px] rounded-full bg-slate-500/20 text-slate-400">PENDENTE</span>',
    confirmed:
      '<span class="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">CONFIRMADO</span>',
    in_progress:
      '<span class="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400">EM ANDAMENTO</span>',
    completed:
      '<span class="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400">CONCLUÍDO</span>',
    cancelled:
      '<span class="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400">CANCELADO</span>',
    no_show:
      '<span class="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400">AUSENTE</span>',
  }
  return badges[status] || ""
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdminDashboard)
} else {
  initAdminDashboard()
}
