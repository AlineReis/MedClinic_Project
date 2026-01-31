import "../../css/global.css"
import { Navigation } from "../components/Navigation"
import { ToastContainer } from "../components/ToastContainer"
import { authStore } from "../stores/authStore"
import { dashboardStore } from "../stores/dashboardStore"
import {
  DASHBOARD_APPOINTMENTS_EVENT,
  type DashboardEventDetail,
} from "../stores/dashboardStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"
import type { PrescriptionSummary } from "../types/prescriptions"
import { openPrescriptionModal } from "./prescriptionModal"
import { openAppointmentModal } from "./appointmentModal"

const nextAppointmentContainer = document.querySelector(
  "[data-next-appointment]",
)
const activityList = document.querySelector(
  "[data-activity-list]",
) as HTMLTableSectionElement | null

let toastContainer: ToastContainer | null = null
let navigation: Navigation | null = null

document.addEventListener("DOMContentLoaded", () => {
  toastContainer = new ToastContainer()
  navigation = new Navigation()
  hydrateSessionUser()
  window.addEventListener(
    DASHBOARD_APPOINTMENTS_EVENT,
    handleDashboardUpdate as EventListener,
  )
  init()
})

async function init() {
  const session = await authStore.refreshSession()

  hydrateSessionUser()

  if (!session) {
    window.location.href = "/pages/login.html"
    return
  }

  if (session.role !== "patient") {
    uiStore.addToast("warning", "Acesso restrito a pacientes.")
    setTimeout(() => {
      window.location.href = "/"
    }, 2000)
    return
  }

  // Load dashboard data for patient
  await dashboardStore.loadAppointmentsForSession(session)
}

function hydrateSessionUser() {
  const session = getSessionFromStorage() ?? authStore.getSession()
  if (!session) return

  document.querySelectorAll("[data-user-name]").forEach(element => {
    element.textContent = session.name || "Usuário"
  })

  document.querySelectorAll("[data-user-initials]").forEach(element => {
    element.textContent = getInitials(session.name || "U")
  })
}

function handleDashboardUpdate(event: CustomEvent<DashboardEventDetail>) {
  const detail = event.detail
  if (!detail) return

  renderNextAppointment(detail.appointments, detail.isLoading, detail.hasError)
  renderPrescriptions(detail.prescriptions, detail.isLoading, detail.hasError)
  renderActivity(
    detail.appointments,
    detail.prescriptions,
    detail.isLoading,
    detail.hasError,
  )
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

  // Attach handlers
  const detailsBtn = nextAppointmentContainer.querySelector('.appointment-details-btn')
  const rescheduleBtn = nextAppointmentContainer.querySelector('.appointment-reschedule-btn')

  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => {
        openAppointmentModal(upcoming.id, 'details')
    })
  }

  if (rescheduleBtn) {
    rescheduleBtn.addEventListener('click', () => {
        openAppointmentModal(upcoming.id, 'reschedule')
    })
  }
}

function renderPrescriptions(
  prescriptions: PrescriptionSummary[],
  isLoading: boolean,
  hasError: boolean,
) {
  const prescriptionsContainer = document.getElementById("prescriptions-container")
  if (!prescriptionsContainer) return

  const cardWrapperClass = "bg-surface-dark border border-border-dark rounded-2xl h-full flex flex-col overflow-hidden"

  if (isLoading) {
    prescriptionsContainer.innerHTML = `
      <div class="${cardWrapperClass} items-center justify-center min-h-[200px]">
        <div class="flex items-center gap-2 text-slate-400 text-sm">
          <span class="material-symbols-outlined text-sm animate-spin">sync</span>
          Carregando prescrições...
        </div>
      </div>
    `
    return
  }

  if (hasError || !prescriptions) {
    prescriptionsContainer.innerHTML = `
      <div class="${cardWrapperClass} items-center justify-center text-center min-h-[200px] p-6">
        <div class="text-sm text-slate-400">
          <p>Não foi possível carregar suas prescrições.</p>
          <p class="text-xs mt-2">Tente novamente mais tarde.</p>
        </div>
      </div>
    `
    return
  }

  if (prescriptions.length === 0) {
    prescriptionsContainer.innerHTML = `
      <div class="${cardWrapperClass} items-center justify-center text-center min-h-[200px] p-6">
        <div class="text-sm text-slate-400">
          <p>Nenhuma prescrição ativa.</p>
          <p class="text-xs mt-2">Suas prescrições médicas aparecerão aqui.</p>
        </div>
      </div>
    `
    return
  }

  // Show only the 3 most recent prescriptions
  const recentPrescriptions = prescriptions.slice(0, 3)
  prescriptionsContainer.innerHTML = `
    <div class="${cardWrapperClass}">
      <div class="flex-1 w-full flex flex-col justify-center">
      ${recentPrescriptions.map((p, index) => `
          <div class="p-5 hover:bg-background-dark/50 transition-all group w-full ${index !== recentPrescriptions.length - 1 ? 'border-b border-border-dark' : ''}">
            <div class="flex items-center justify-between gap-4">
              <!-- Icon + Info -->
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div class="size-11 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-amber-500 text-[22px]">medication</span>
                </div>
                <div class="flex-1 min-w-0">
                  <!-- Name: Larger, wrapped, no truncate -->
                  <p class="font-bold text-lg text-white leading-tight mb-1 break-words">${p.medication_name}</p>
                  
                  <!-- Dosage -->
                  ${p.dosage ? `<p class="text-sm text-slate-400 mb-2 line-clamp-2">${p.dosage}</p>` : ""}
                  
                  <!-- Date (Smaller) -->
                  <p class="text-xs text-slate-500 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[12px] aligned-icon">calendar_today</span>
                    ${formatDate(p.created_at)}
                  </p>
                </div>
              </div>
              
              <!-- Action Button (Small, always visible) -->
              <button 
                data-prescription-id="${p.id}"
                class="prescription-details-btn size-9 rounded-xl border border-border-dark bg-transparent text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all shrink-0 shadow-sm"
                title="Ver detalhes"
              >
                <span class="material-symbols-outlined text-[20px]">visibility</span>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
      ${prescriptions.length > 3 ? `
        <div class="p-4 border-t border-border-dark text-center bg-background-dark/30">
          <p class="text-xs text-slate-500">
            +${prescriptions.length - 3} prescrição${prescriptions.length - 3 > 1 ? "ões" : ""} anterior${prescriptions.length - 3 > 1 ? "es" : ""}
          </p>
        </div>
      ` : ""}
    </div>
  `
  
  // Attach click handlers to Details buttons
  prescriptionsContainer.querySelectorAll('.prescription-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Use currentTarget to ensure we get the button element, even if icon was clicked
      const target = e.currentTarget as HTMLElement
      const prescriptionId = parseInt(target.getAttribute('data-prescription-id') || '0')
      if (prescriptionId) {
        openPrescriptionModal(prescriptionId)
      }
    })
  })
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
  // Filter out cancelled appointments from activity feed
  const activeAppointments = appointments.filter(
    appointment => 
      appointment.status !== 'cancelled_by_patient' && 
      appointment.status !== 'cancelled_by_clinic'
  )
  
  const appointmentItems = activeAppointments.map(appointment => {
    let icon = "event"
    let color = "text-blue-400"
    
    if (appointment.status === "completed") {
      icon = "check_circle"
      color = "text-emerald-500"
    } else if (appointment.status === "confirmed") {
      icon = "event_available"
      color = "text-green-400"
    }
    
    return {
      icon,
      color,
      date: formatDate(appointment.date),
      label: `Consulta ${formatStatus(appointment.status)}${appointment.professional_name ? ` com ${appointment.professional_name}` : ""}`,
      timestamp: toTimestamp(appointment.date),
    }
  })

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
    <div class="flex flex-col md:flex-row gap-6 items-center w-full justify-between">
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
          class="appointment-details-btn px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all"
        >
          Detalhes
        </button>
        <button
          class="appointment-reschedule-btn px-4 py-2 border border-border-dark text-slate-400 hover:text-white text-xs font-bold rounded-lg transition-all"
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
  if (!name) return "U"
  
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
  if (!value) return value
  
  // Handle both YYYY-MM-DD and YYYY-MM-DD HH:MM:SS formats
  let dateStr = value
  
  // If it's a datetime string (has time component), extract just the date part
  if (value.includes(' ')) {
    dateStr = value.split(' ')[0]
  }
  
  // Append T12:00:00 to ensure we are in the middle of the day
  // preventing timezone shifts from T00:00:00 UTC to previous day
  if (!dateStr.includes('T')) {
    dateStr = `${dateStr}T12:00:00`
  }
  
  const parsed = new Date(dateStr)
  
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

function toTimestamp(dateValue: string, timeValue?: string) {
  const date = timeValue ? `${dateValue}T${timeValue}` : `${dateValue}T12:00:00`
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
