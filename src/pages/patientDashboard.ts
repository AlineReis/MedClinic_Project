import { logout as logoutService } from "../services/authService"
import { authStore } from "../stores/authStore"
import {
  DASHBOARD_APPOINTMENTS_EVENT,
  type DashboardEventDetail,
} from "../stores/dashboardStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"
import type { PrescriptionSummary } from "../types/prescriptions"

const nextAppointmentContainer = document.querySelector(
  "[data-next-appointment]",
)
const activityList = document.querySelector(
  "[data-activity-list]",
) as HTMLTableSectionElement | null
const toastContainer = document.getElementById("toast-container")

document.addEventListener("DOMContentLoaded", () => {
  setupLogout()
  hydrateSessionUser()
  window.addEventListener(
    DASHBOARD_APPOINTMENTS_EVENT,
    handleDashboardUpdate as EventListener,
  )
  renderToasts()
})

async function setupLogout() {
  const logoutButton = document.querySelector("[data-logout-button]")
  if (!logoutButton) return

  logoutButton.addEventListener("click", async () => {
    const response = await logoutService()
    if (!response.success) {
      uiStore.addToast(
        "error",
        response.error?.message ?? "Não foi possível sair da sua conta.",
      )
      renderToasts()
      return
    }

    authStore.clearSession()
    window.location.href = getBasePath() + "login.html"
  })
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

function handleDashboardUpdate(event: CustomEvent<DashboardEventDetail>) {
  const detail = event.detail
  if (!detail) return

  renderNextAppointment(detail.appointments, detail.isLoading, detail.hasError)
  renderActivity(
    detail.appointments,
    detail.prescriptions,
    detail.isLoading,
    detail.hasError,
  )
  renderToasts()
}

function renderNextAppointment(
  appointments: AppointmentSummary[],
  isLoading: boolean,
  hasError: boolean,
) {
  if (!nextAppointmentContainer) return

  if (isLoading) {
    nextAppointmentContainer.innerHTML = buildLoadingCard(
      "Carregando informações da próxima consulta...",
    )
    return
  }

  if (hasError) {
    nextAppointmentContainer.innerHTML = buildEmptyCard(
      "Não foi possível carregar suas consultas agora.",
      "Tente atualizar a página em instantes.",
    )
    return
  }

  const upcoming = getUpcomingAppointment(appointments)
  if (!upcoming) {
    nextAppointmentContainer.innerHTML = buildEmptyCard(
      "Nenhuma consulta agendada.",
      "Que tal marcar uma nova consulta?",
      `${getBasePath()}schedule-appointment.html`,
      "Agendar consulta",
    )
    return
  }

  nextAppointmentContainer.innerHTML = buildAppointmentCard(upcoming)
}

function renderActivity(
  appointments: AppointmentSummary[],
  prescriptions: PrescriptionSummary[],
  isLoading: boolean,
  hasError: boolean,
) {
  if (!activityList) return

  if (isLoading) {
    activityList.innerHTML = buildActivityRow(
      "sync",
      "Carregando atividades recentes...",
      "",
      "text-slate-400",
    )
    return
  }

  if (hasError) {
    activityList.innerHTML = buildActivityRow(
      "error",
      "Não foi possível carregar suas atividades.",
      "",
      "text-red-400",
    )
    return
  }

  const items = buildActivityItems(appointments, prescriptions)
  if (items.length === 0) {
    activityList.innerHTML = buildActivityRow(
      "calendar_month",
      "Nenhuma atividade recente encontrada.",
      "",
      "text-slate-400",
    )
    return
  }

  activityList.innerHTML = items
    .slice(0, 5)
    .map(item => buildActivityRow(item.icon, item.label, item.date, item.color))
    .join("")
}

function buildActivityItems(
  appointments: AppointmentSummary[],
  prescriptions: PrescriptionSummary[],
) {
  const appointmentItems = appointments.map(appointment => ({
    icon: appointment.status === "completed" ? "check_circle" : "event",
    color:
      appointment.status === "completed" ? "text-emerald-500" : "text-blue-400",
    date: formatDate(appointment.date),
    label: `Consulta ${formatStatus(appointment.status)} com ${appointment.professional_name}`,
    timestamp: toTimestamp(appointment.date),
  }))

  const prescriptionItems = prescriptions.map(prescription => ({
    icon: "receipt_long",
    color: "text-amber-500",
    date: formatDate(prescription.created_at),
    label: `Prescrição de ${prescription.medication_name}`,
    timestamp: toTimestamp(prescription.created_at),
  }))

  return [...appointmentItems, ...prescriptionItems].sort(
    (a, b) => b.timestamp - a.timestamp,
  )
}

function buildActivityRow(
  icon: string,
  label: string,
  date: string,
  colorClass: string,
) {
  return `
    <tr class="hover:bg-border-dark/20 transition-colors">
      <td class="px-6 py-4 flex items-center gap-3">
        <span class="material-symbols-outlined ${colorClass}">${icon}</span>
        ${label}
      </td>
      <td class="px-6 py-4 text-slate-500 text-right">${date}</td>
    </tr>
  `
}

function buildLoadingCard(message: string) {
  return `
    <div class="flex items-center gap-2 text-slate-400 text-sm">
      <span class="material-symbols-outlined text-sm">sync</span>
      ${message}
    </div>
  `
}

function buildEmptyCard(
  title: string,
  description: string,
  actionHref?: string,
  actionLabel?: string,
) {
  const action =
    actionHref && actionLabel
      ? `
        <a
          href="${actionHref}"
          class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">calendar_add_on</span>
          ${actionLabel}
        </a>
      `
      : ""

  return `
    <div class="flex flex-col items-start gap-2 text-slate-300">
      <h3 class="text-base font-bold">${title}</h3>
      <p class="text-sm text-slate-400">${description}</p>
      ${action}
    </div>
  `
}

function buildAppointmentCard(appointment: AppointmentSummary) {
  return `
    <div class="flex flex-col md:flex-row gap-6">
      <div class="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold border-2 border-primary/20 shrink-0">
        ${getInitials(appointment.professional_name)}
      </div>
      <div class="flex-1">
        <span
          class="text-[10px] font-bold ${getStatusTagClass(appointment.status)} px-2 py-0.5 rounded uppercase"
        >
          ${formatStatus(appointment.status)}
        </span>
        <h3 class="font-bold text-xl mt-2">${appointment.professional_name}</h3>
        <p class="text-sm text-primary font-medium">${appointment.specialty}</p>
        <div class="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">calendar_today</span>
            ${formatDate(appointment.date)}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">schedule</span>
            ${appointment.time}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">location_on</span>
            ${appointment.room ? `Sala ${appointment.room}` : "Unidade MedClinic"}
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 shrink-0">
        <button
          class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all"
        >
          Detalhes
        </button>
        <button
          class="px-4 py-2 border border-border-dark text-slate-400 hover:text-white text-xs font-bold rounded-lg transition-all"
        >
          Remarcar
        </button>
      </div>
    </div>
  `
}

function getUpcomingAppointment(appointments: AppointmentSummary[]) {
  return [...appointments]
    .filter(appointment =>
      ["scheduled", "confirmed"].includes(appointment.status),
    )
    .sort(
      (a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time),
    )[0]
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

function formatStatus(status: string) {
  const map: Record<string, string> = {
    scheduled: "Agendada",
    confirmed: "Confirmada",
    completed: "Realizada",
    cancelled_by_patient: "Cancelada",
    cancelled_by_clinic: "Cancelada",
  }

  return map[status] ?? status
}

function getStatusTagClass(status: string) {
  if (status === "confirmed" || status === "scheduled") {
    return "text-emerald-500 bg-emerald-500/10"
  }

  if (status === "completed") {
    return "text-blue-500 bg-blue-500/10"
  }

  return "text-amber-500 bg-amber-500/10"
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

function toTimestamp(dateValue: string, timeValue?: string) {
  const date = timeValue ? `${dateValue}T${timeValue}` : dateValue
  const parsed = new Date(date)
  const timestamp = parsed.getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
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
