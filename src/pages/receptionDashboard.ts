import "../../css/pages/reception-dashboard.css"
import { Navigation } from "../components/Navigation"
import { ToastContainer } from "../components/ToastContainer"
import { checkInAppointment, listAppointments } from "../services/appointmentsService"
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
        <td colspan="5" class="table__empty">
          <div class="flex flex-col items-center gap-2">
            <span class="material-symbols-outlined table__empty-icon">check_circle</span>
            <p class="table__empty-text">Nenhum check-in pendente no momento</p>
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
      <tr class="table__row" data-appointment-id="${apt.id}">
        <td class="table__cell font-medium">${apt.patient_name}</td>
        <td class="table__cell table__cell--muted">${apt.time}</td>
        <td class="table__cell">${apt.professional_name}</td>
        <td class="table__cell">${statusBadge}</td>
        <td class="table__cell">
          <button
            class="btn btn--sm ${isReady ? "btn--primary" : "btn--outline"}"
            ${!isReady ? "disabled" : ""}
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
  const button = document.querySelector(
    `[data-checkin-btn="${appointmentId}"]`,
  ) as HTMLButtonElement | null

  if (button) {
    button.disabled = true
    button.classList.add("btn--loading")
  }

  try {
    const response = await checkInAppointment(appointmentId)

    if (response.success) {
      uiStore.addToast("success", "Check-in realizado com sucesso")
      await loadDashboardData()
    } else {
      uiStore.addToast(
        "error",
        response.error?.message || "Não foi possível confirmar o check-in.",
      )
    }
  } catch (error) {
    console.error("Erro ao confirmar check-in:", error)
    uiStore.addToast(
      "error",
      "Erro de comunicação ao confirmar o check-in. Tente novamente.",
    )
  } finally {
    if (button) {
      button.disabled = false
      button.classList.remove("btn--loading")
    }
  }
}

function getStatusBadge(status: string): string {
  const badges: Record<string, { color: string; label: string }> = {
    scheduled: { color: "neutral", label: "PENDENTE" },
    confirmed: { color: "warning", label: "AGUARDANDO" },
    in_progress: { color: "success", label: "EM ATENDIMENTO" },
    completed: { color: "info", label: "CONCLUÍDO" },
    cancelled_by_patient: { color: "error", label: "CANCELADO" },
    cancelled_by_clinic: { color: "error", label: "CANCELADO" },
    no_show: { color: "error", label: "AUSENTE" },
  }

  const badge = badges[status] || { color: "neutral", label: status.toUpperCase() }

  return `<span class="badge badge--${badge.color}">${badge.label}</span>`
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
