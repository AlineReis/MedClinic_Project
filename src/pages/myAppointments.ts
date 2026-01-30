import { listAppointments } from "../services/appointmentsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"

const listContainer = document.getElementById("appointments-list")
const toastContainer = document.getElementById("toast-container")

document.addEventListener("DOMContentLoaded", () => {
  hydrateSessionUser()
  loadAppointments()
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

  listContainer.innerHTML = response.data.appointments
    .map(appointment => buildAppointmentCard(appointment))
    .join("")
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
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg text-white">${appointment.professional_name}</h3>
          <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusBadge(appointment.status)}">
            ${getStatusLabel(appointment.status)}
          </span>
        </div>
        <p class="text-primary text-sm font-medium mb-4">${appointment.specialty}</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-text-secondary">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base">calendar_month</span>
            ${formatDate(appointment.date)}
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base">schedule</span>
            ${appointment.time}
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base">location_on</span>
            ${appointment.room ? `Sala ${appointment.room}` : "Unidade MedClinic"}
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base">attach_money</span>
            ${appointment.price ? formatCurrency(appointment.price) : "A confirmar"}
          </div>
        </div>
      </div>
      <div class="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
        <button class="flex-1 md:flex-none border border-border-dark hover:bg-white/5 text-text-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Detalhes
        </button>
        ${appointment.status === "scheduled" ? buildCancelButton() : ""}
      </div>
    </div>
  `
}

function buildCancelButton() {
  return `
    <button class="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
  const parsed = new Date(value)
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
