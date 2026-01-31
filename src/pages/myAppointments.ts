import { listAppointments, cancelAppointment } from "../services/appointmentsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"
import { openAppointmentModal } from "./appointmentModal"

const listContainer = document.getElementById("appointments-list")
const toastContainer = document.getElementById("toast-container")

document.addEventListener("DOMContentLoaded", () => {
  hydrateSessionUser()
  loadAppointments()
  
  // Subscribe to toast updates for auto-dismiss
  uiStore.subscribe((toasts) => {
    if (!toastContainer) return
    toastContainer.innerHTML = toasts.map(toast => `
      <div class="rounded-lg px-4 py-2 text-sm shadow-lg border border-border-dark bg-surface-dark ${getToastColor(toast.level)}">
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
  return `
    <div class="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start relative overflow-hidden">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(appointment.status)}"></div>
      <div class="flex-1 w-full">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-lg text-white">${appointment.professional_name}</h3>
          <span class="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusBadge(appointment.status)} whitespace-nowrap flex items-center h-10">
            ${getStatusLabel(appointment.status)}
          </span>
        </div>
        <p class="text-primary text-sm font-medium mb-4">${appointment.specialty}</p>
        <div class="flex flex-wrap gap-4 text-sm text-text-secondary">
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined text-base">calendar_month</span>
            ${formatDate(appointment.date)}
          </div>
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined text-base">schedule</span>
            ${appointment.time}
          </div>
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined text-base">location_on</span>
            ${appointment.room ? `Sala ${appointment.room}` : "Unidade MedClinic"}
          </div>
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined text-base">attach_money</span>
            ${appointment.price ? formatCurrency(appointment.price) : "A confirmar"}
          </div>
        </div>
      </div>
      <div class="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
        <button 
          class="details-btn flex-1 md:flex-none border border-border-dark hover:bg-white/5 text-text-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap h-10"
          data-appointment-id="${appointment.id}"
        >
          Detalhes
        </button>
        ${appointment.status === "scheduled" ? buildCancelButton(appointment.id) : ""}
      </div>
    </div>
  `
}

function buildCancelButton(appointmentId: number) {
  return `
    <button 
      class="cancel-btn flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors h-10"
      data-appointment-id="${appointmentId}"
    >
      Cancelar
    </button>
  `
}

function buildEmptyState(
  title: string,
  description: string,
  actionHref?: string,
) {
  const action = actionHref
    ? `
      <a href="${actionHref}" class="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
        Agendar Agora
      </a>
    `
    : ""

  return `
    <div class="flex flex-col items-center justify-center py-20 text-center bg-surface-dark border border-border-dark rounded-xl">
      <span class="material-symbols-outlined text-4xl text-text-secondary mb-4">event_busy</span>
      <h3 class="text-lg font-bold text-white">${title}</h3>
      <p class="text-text-secondary mb-6">${description}</p>
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
  const map: Record<string, string> = {
    scheduled: "bg-green-500",
    confirmed: "bg-green-500",
    cancelled_by_patient: "bg-red-500",
    cancelled_by_clinic: "bg-red-500",
    completed: "bg-blue-500",
  }
  return map[status] ?? "bg-slate-500"
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: "bg-green-500/10 text-green-500 border border-green-500/20",
    confirmed: "bg-green-500/10 text-green-500 border border-green-500/20",
    cancelled_by_patient: "bg-red-500/10 text-red-500 border border-red-500/20",
    cancelled_by_clinic: "bg-red-500/10 text-red-500 border border-red-500/20",
    completed: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  }
  return map[status] ?? "bg-slate-800 text-slate-400 border border-slate-700"
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Realizado",
    cancelled_by_patient: "Cancelado",
    cancelled_by_clinic: "Cancelado",
  }
  return map[status] ?? status
}

function getToastColor(level: string) {
  const map: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  }
  return map[level] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"
}

function renderToasts() {
  if (!toastContainer) return
  toastContainer.innerHTML = ""
  uiStore.getToasts().forEach(toast => {
    const toastElement = document.createElement("div")
    toastElement.className =
      "rounded-lg px-4 py-2 text-sm shadow-lg border border-border-dark bg-surface-dark"
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
