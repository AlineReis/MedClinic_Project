import { Navigation } from "../components/Navigation"
import { ToastContainer } from "../components/ToastContainer"
import { listAppointments } from "../services/appointmentsService"
import { logout } from "../services/authService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"

/**
 * Reception Dashboard Page
 * Displays real-time appointment data for receptionists to manage check-ins and room assignments
 * Consumes GET /appointments with filters for status and date
 */

let toastContainer: ToastContainer | null = null
let navigation: Navigation | null = null

async function initReceptionDashboard() {
  // RBAC check: only receptionist, clinic_admin, and system_admin can access
  toastContainer = new ToastContainer()
  navigation = new Navigation()
  const session = await authStore.refreshSession()

  if (
    !session ||
    (session.role !== "receptionist" &&
      session.role !== "clinic_admin" &&
      session.role !== "system_admin")
  ) {
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

  const userNameEl = document.querySelector("[data-user-name]")
  const userRoleEl = document.querySelectorAll("[data-user-role]")
  const userInitialsEl = document.querySelector("[data-user-initials]")

  if (userNameEl) {
    userNameEl.textContent = session.name
  }

  userRoleEl.forEach((el) => {
    el.textContent = getRoleDisplay(session.role)
  })

  if (userInitialsEl) {
    const initials = session.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    userInitialsEl.textContent = initials
  }
}

function setupLogoutButton() {
  const logoutBtn = document.querySelector("[data-logout-button]")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      await logout()
      authStore.clearSession()
      window.location.href = "/pages/login.html"
    })
  }
}

async function loadDashboardData() {
  const today = new Date().toISOString().split("T")[0]

  try {
    // Load today's appointments
    const response = await listAppointments({
      date: today,
      pageSize: 100, // Get all appointments for today
    })

    if (response.success && response.data) {
      const appointments = response.data.appointments
      updateStatistics(appointments)
      updateUpcomingCheckIns(appointments)
    } else {
      uiStore.addToast(
        "error",
        "Não foi possível carregar os agendamentos. Tente novamente.",
      )
    }
  } catch (error) {
    console.error("Error loading reception dashboard:", error)
    uiStore.addToast(
      "error",
      "Erro ao carregar dados do painel. Tente novamente.",
    )
  }
}

function updateStatistics(appointments: AppointmentSummary[]) {
  // Calculate statistics based on appointment status
  const scheduledToday = appointments.length
  const awaitingCheckin = appointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "confirmed",
  ).length
  const inProgress = appointments.filter(
    (apt) => apt.status === "in_progress",
  ).length
  const noShow = appointments.filter((apt) => apt.status === "no_show").length

  // Update stats cards (using direct DOM manipulation since HTML has hardcoded values)
  const statsCards = document.querySelectorAll("section")[0]
  if (statsCards) {
    const cards = statsCards.querySelectorAll("h3")
    if (cards[0]) cards[0].textContent = scheduledToday.toString()
    if (cards[1]) cards[1].textContent = awaitingCheckin.toString()
    if (cards[2]) cards[2].textContent = inProgress.toString()
    if (cards[3]) cards[3].textContent = noShow.toString()
  }
}

function updateUpcomingCheckIns(appointments: AppointmentSummary[]) {
  // Filter appointments that need check-in (scheduled or confirmed) and sort by time
  const upcomingAppointments = appointments
    .filter(
      (apt) => apt.status === "scheduled" || apt.status === "confirmed",
    )
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 10) // Show next 10 appointments

  const tbody = document.querySelector("tbody")
  if (!tbody) return

  if (upcomingAppointments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-slate-400">
          <div class="flex flex-col items-center gap-2">
            <span class="material-symbols-outlined text-4xl">check_circle</span>
            <p>Nenhum check-in pendente no momento</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = upcomingAppointments
    .map((apt) => {
      const statusBadge = getStatusBadge(apt.status)
      const isReady = apt.status === "confirmed"

      return `
      <tr class="hover:bg-border-dark/10" data-appointment-id="${apt.id}">
        <td class="px-6 py-4 font-medium">${apt.patient_name}</td>
        <td class="px-6 py-4 text-slate-400">${apt.time}</td>
        <td class="px-6 py-4">${apt.professional_name}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4">
          <button
            class="px-3 py-1.5 ${
              isReady
                ? "bg-primary text-white"
                : "bg-border-dark text-slate-400"
            } text-[10px] font-bold rounded"
            data-checkin-btn="${apt.id}"
          >
            CHECK-IN
          </button>
        </td>
      </tr>
    `
    })
    .join("")

  // Setup check-in button handlers
  setupCheckInButtons()
}

function setupCheckInButtons() {
  const buttons = document.querySelectorAll("[data-checkin-btn]")
  buttons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.target as HTMLButtonElement
      const appointmentId = target.getAttribute("data-checkin-btn")

      if (appointmentId) {
        await handleCheckIn(Number(appointmentId))
      }
    })
  })
}

async function handleCheckIn(appointmentId: number) {
  // For now, just show a success message
  // In a full implementation, this would call an endpoint like PATCH /appointments/:id/check-in
  uiStore.addToast(
    "info",
    "Funcionalidade de check-in será implementada com endpoint específico",
  )

  // TODO: Implement when backend provides PATCH /appointments/:id/check-in endpoint
  // const response = await updateAppointmentStatus(appointmentId, 'in_progress')
  // if (response.success) {
  //   uiStore.addToast('success', 'Check-in realizado com sucesso')
  //   loadDashboardData() // Refresh data
  // }
}

function getStatusBadge(status: string): string {
  const badges: Record<string, { color: string; label: string }> = {
    scheduled: { color: "slate", label: "PENDENTE" },
    confirmed: { color: "amber", label: "AGUARDANDO" },
    in_progress: { color: "emerald", label: "EM ATENDIMENTO" },
    completed: { color: "blue", label: "CONCLUÍDO" },
    cancelled_by_patient: { color: "red", label: "CANCELADO" },
    cancelled_by_clinic: { color: "red", label: "CANCELADO" },
    no_show: { color: "red", label: "AUSENTE" },
  }

  const badge = badges[status] || { color: "slate", label: status.toUpperCase() }

  return `<span class="px-2 py-0.5 rounded bg-${badge.color}-500/10 text-${badge.color}-500 text-[10px] font-bold">${badge.label}</span>`
}

function getRoleDisplay(role: string): string {
  const roles: Record<string, string> = {
    patient: "Paciente",
    receptionist: "Recepcionista",
    lab_tech: "Técnico de Laboratório",
    health_professional: "Profissional de Saúde",
    clinic_admin: "Administrador",
    system_admin: "Administrador do Sistema",
  }
  return roles[role] || role
}

// Initialize on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReceptionDashboard)
} else {
  initReceptionDashboard()
}
