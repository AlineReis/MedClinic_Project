import "../../css/pages/my-appointments.css"
import { Navigation } from "../components/Navigation"
import { listAppointments, cancelAppointment } from "../services/appointmentsService"
import { logout } from "../services/authService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"
import { openAppointmentModal } from "./appointmentModal"

const listContainer = document.getElementById("appointments-list")
const toastContainer = document.getElementById("toast-container")

let navigation: Navigation | null = null

document.addEventListener("DOMContentLoaded", () => {
  navigation = new Navigation()
  hydrateSessionUser()
  loadAppointments()

  // Subscribe to toast updates for auto-dismiss
  uiStore.subscribe((toasts) => {
    if (!toastContainer) return
    toastContainer.innerHTML = toasts.map(toast => `
      <div class="toast-item toast-item--${toast.level || 'info'}">
        ${toast.text}
      </div>
    `).join('')
  })
})

async function loadAppointments() {
  if (!listContainer) return

  const session = await resolveSession()
  if (!session) {
    redirectToLogin()
    return
  }

  const filters = session.role === "patient" ? { patientId: session.id } : {}
  const response = await listAppointments(filters)

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar seus agendamentos.",
    )
    listContainer.innerHTML = buildEmptyState(
      "Não foi possível carregar seus agendamentos.",
      "Tente novamente em instantes.",
    )
    renderToasts()
    return
  }

  if (response.data.appointments.length === 0) {
    listContainer.innerHTML = buildEmptyState(
      "Nenhum agendamento",
      "Você ainda não tem consultas agendadas.",
      `${getBasePath()}schedule-appointment.html`,
    )
    return
  }

  // Sort appointments: scheduled/confirmed first, then cancelled
  const sortedAppointments = [...response.data.appointments].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      scheduled: 1,
      confirmed: 1,
      completed: 2,
      cancelled_by_patient: 3,
      cancelled_by_clinic: 3,
    }

    const priorityA = statusPriority[a.status] || 4
    const priorityB = statusPriority[b.status] || 4

    // If same priority, sort by date (newest first)
    if (priorityA === priorityB) {
      const dateA = new Date(`${a.date}T${a.time}`).getTime()
      const dateB = new Date(`${b.date}T${b.time}`).getTime()
      return dateB - dateA
    }

    return priorityA - priorityB
  })

  listContainer.innerHTML = sortedAppointments
    .map(appointment => buildAppointmentCard(appointment))
    .join("")

  // Attach event listeners
  attachButtonHandlers(sortedAppointments)
}

async function resolveSession() {
  return (getSessionFromStorage() ?? authStore.getSession()) ??
    (await authStore.refreshSession())
}

function buildAppointmentCard(appointment: AppointmentSummary) {
  const statusBadgeClass = getStatusBadge(appointment.status)
  // Ensure the modifier class is generated correctly. 
  // Map internal status to modifier class suffix if needed, but assuming 1:1 match based on appointment-card.css
  const cardStatusClass = `appointment-card--${appointment.status}`
  const canCancel = appointment.status === 'scheduled'

  return `
    <article class="appointment-card ${cardStatusClass}">
      <div class="appointment-card__content">
        <div class="appointment-card__header">
          <div>
            <h3 class="appointment-card__doctor-name">${appointment.professional_name}</h3>
            <p class="appointment-card__specialty">${appointment.specialty}</p>
          </div>
          <span class="status-badge ${statusBadgeClass}">
            ${getStatusLabel(appointment.status)}
          </span>
        </div>
        
        <div class="appointment-card__meta-grid">
          <div class="appointment-card__meta-item">
            <span class="material-symbols-outlined">calendar_month</span>
            ${formatDate(appointment.date)}
          </div>
          <div class="appointment-card__meta-item">
            <span class="material-symbols-outlined">schedule</span>
            ${appointment.time}
          </div>
          <div class="appointment-card__meta-item">
            <span class="material-symbols-outlined">location_on</span>
            ${appointment.room ? `Sala ${appointment.room}` : "Unidade MedClinic"}
          </div>
        </div>
      </div>

      <div class="appointment-card__actions">
        <button 
          class="appointment-card__btn appointment-card__btn--details details-btn"
          data-appointment-id="${appointment.id}"
        >
          <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 4px;">info</span>
          Detalhes
        </button>
        ${canCancel ? `
          <button 
            class="appointment-card__btn appointment-card__btn--cancel cancel-btn"
            data-appointment-id="${appointment.id}"
          >
            <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 4px;">cancel</span>
            Cancelar
          </button>
        ` : ""}
      </div>
    </article>
  `
}

function buildEmptyState(
  title: string,
  description: string,
  actionHref?: string,
) {
  const action = actionHref
    ? `
      <a href="${actionHref}" class="state-container__action">
        Agendar Agora
      </a>
    `
    : ""

  return `
    <div class="state-container">
      <span class="material-symbols-outlined state-container__icon">event_busy</span>
      <h3 class="state-container__title">${title}</h3>
      <p class="state-container__description">${description}</p>
      ${action}
    </div>
  `
}

function hydrateSessionUser() {
  const session = getSessionFromStorage() ?? authStore.getSession()
  if (!session) return

  document.querySelectorAll("[data-user-name]").forEach(element => {
    element.textContent = session.name
  })

  document.querySelectorAll("[data-user-initials]").forEach(element => {
    element.textContent = getInitials(session.name)
  })

  // Logout handler is managed by Navigation component
}

function redirectToLogin() {
  window.location.href = getBasePath() + "login.html"
}

function getSessionFromStorage(): UserSession | null {
  try {
    const stored = sessionStorage.getItem("medclinic-session")
    return stored ? (JSON.parse(stored) as UserSession) : null
  } catch (error) {
    console.warn("Não foi possível ler a sessão armazenada.", error)
    return null
  }
}

function getBasePath() {
  return window.location.pathname.includes("/pages/") ? "" : "pages/"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatDate(value: string) {
  if (!value) return value

  // Create date at noon to avoid timezone issues
  // If string already has time (contains T), use it as is
  // Otherwise append T12:00:00
  const dateStr = value.includes('T') ? value : `${value}T12:00:00`
  const parsed = new Date(dateStr)

  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function getStatusColor(status: string) {
  // Used for activity icons or other simple color needs
  const map: Record<string, string> = {
    scheduled: "activity-icon-success",
    confirmed: "activity-icon-success",
    cancelled_by_patient: "activity-icon-warning",
    cancelled_by_clinic: "activity-icon-warning",
    completed: "activity-icon-info",
  }
  return map[status] ?? "activity-icon-neutral"
}

function getStatusBadge(status: string) {
  // Returns just the modifier class, the base .status-badge is added in template
  const map: Record<string, string> = {
    scheduled: "status-badge--scheduled",
    confirmed: "status-badge--confirmed",
    cancelled_by_patient: "status-badge--cancelled",
    cancelled_by_clinic: "status-badge--cancelled",
    completed: "status-badge--completed",
    waiting: "status-badge--scheduled",
  }
  return map[status] ?? ""
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Realizado",
    cancelled_by_patient: "Cancelado",
    cancelled_by_clinic: "Cancelado",
    waiting: "Aguardando",
  }
  return map[status] ?? status
}

function getToastColor(level: string) {
  // Returns modifier class for toasts
  const map: Record<string, string> = {
    success: "toast-item--success",
    error: "toast-item--error",
    info: "toast-item--info",
    warning: "toast-item--warning",
  }
  return map[level] ?? "toast-item--info"
}


function renderToasts() {
  if (!toastContainer) return
  toastContainer.innerHTML = ""
  uiStore.getToasts().forEach(toast => {
    const toastElement = document.createElement("div")
    toastElement.className = `toast-item toast-item--${toast.level || 'info'}`
    toastElement.textContent = toast.text
    toastContainer.appendChild(toastElement)
  })
}

function attachButtonHandlers(appointments: AppointmentSummary[]) {
  // Details button handlers
  document.querySelectorAll('.details-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appointmentId = parseInt(btn.getAttribute('data-appointment-id') || '0')
      if (appointmentId) {
        await openAppointmentModal(appointmentId, 'details')
      }
    })
  })

  // Cancel button handlers
  document.querySelectorAll('.cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appointmentId = parseInt(btn.getAttribute('data-appointment-id') || '0')
      if (!appointmentId) return

      const appointment = appointments.find(a => a.id === appointmentId)
      if (!appointment) return

      const confirmed = confirm(
        `Confirmar o cancelamento da consulta com ${appointment.professional_name} em ${formatDate(appointment.date)} às ${appointment.time}?`
      )

      if (!confirmed) return

      // Loading state
      const button = btn as HTMLButtonElement
      button.disabled = true
      button.textContent = 'Cancelando...'

      try {
        const result = await cancelAppointment(appointmentId, { reason: 'Cancelado pelo paciente' })

        if (result.success) {
          uiStore.addToast('success', 'Consulta cancelada com sucesso')
          // Reload appointments
          setTimeout(() => loadAppointments(), 1000)
        } else {
          uiStore.addToast('error', result.error?.message || 'Erro ao cancelar consulta')
          button.disabled = false
          button.textContent = 'Cancelar'
        }
      } catch (error) {
        console.error('Error canceling appointment:', error)
        uiStore.addToast('error', 'Erro ao processar cancelamento')
        button.disabled = false
        button.textContent = 'Cancelar'
      }
    })
  })
}
