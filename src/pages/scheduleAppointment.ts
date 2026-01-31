import {
  cancelAppointment,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
} from "../services/appointmentsService"
import {
  getProfessionalAvailability,
  listProfessionals,
} from "../services/professionalsService"
import { authStore } from "../stores/authStore"
import { dashboardStore } from "../stores/dashboardStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"
import type {
  ProfessionalAvailabilityEntry,
  ProfessionalSummary,
} from "../types/professionals"
import { mapAppointmentError } from "../utils/errorMapper"

function buildAppointmentStatusText(appointments: AppointmentSummary[]) {
  const next = appointments[0]
  return next
    ? `Próximo: ${next.professional_name} • ${formatDate(next.date)} • ${next.time}`
    : "Nenhum agendamento"
}

function buildAppointmentsLoadingState() {
  return `
    <div class="appointment-card-plain u-flex-center">
      <p class="u-text-secondary u-fs-sm">Sincronizando dados...</p>
    </div>
  `
}

function buildAppointmentsEmptyState(title: string, description: string) {
  return `
    <div class="appointment-card-plain">
      <p class="u-fw-700 text-white">${title}</p>
      <p class="u-text-secondary u-fs-xs u-mt-05">${description}</p>
    </div>
  `
}

function renderAppointmentCards(appointments: AppointmentSummary[]) {
  if (!appointmentsList) return

  appointmentsList.innerHTML = appointments
    .map(appointment => buildAppointmentCard(appointment))
    .join("")

  appointmentsList.querySelectorAll("[data-action='cancel-appointment']").forEach(
    button => {
      button.addEventListener("click", async event => {
        const target = event.currentTarget as HTMLButtonElement
        const appointmentId = Number(target.dataset.appointmentId)
        if (!appointmentId) return

        await handleCancelAppointment(appointmentId)
      })
    },
  )

  appointmentsList.querySelectorAll("[data-action='reschedule-appointment']").forEach(
    button => {
      button.addEventListener("click", async event => {
        const target = event.currentTarget as HTMLButtonElement
        const appointmentId = Number(target.dataset.appointmentId)
        const professionalId = Number(target.dataset.professionalId)
        if (!appointmentId || !professionalId) return

        await handleRescheduleClick(appointmentId, professionalId)
      })
    },
  )
}

function buildAppointmentCard(appointment: AppointmentSummary) {
  const canModify = appointment.status === "scheduled" || appointment.status === "confirmed"

  return `
    <div class="appointment-card">
      <div class="doctor-info-group">
        <div class="doctor-img" style="background-image: url('${appointment.professional_image || ''}')">
          ${!appointment.professional_image ? getInitials(appointment.professional_name) : ''}
        </div>
        <div class="appointment-main-info">
          <div class="u-flex u-justify-between u-items-center">
            <h3 class="doctor-name">${appointment.professional_name}</h3>
            <span class="appointment-status status-${appointment.status}">${getStatusLabel(appointment.status)}</span>
          </div>
          <p class="doctor-specialty">${appointment.specialty}</p>
          <div class="appointment-schedule-info">
            <div class="schedule-item">
              <span class="material-symbols-outlined schedule-icon">calendar_month</span>
              ${formatDate(appointment.date)}
            </div>
            <div class="schedule-item">
              <span class="material-symbols-outlined schedule-icon">schedule</span>
              ${appointment.time}
            </div>
          </div>
        </div>
      </div>
      
      ${canModify ? `
        <div class="appointment-actions">
          <button
            class="btn-pill-outline btn-pill-primary"
            data-action="reschedule-appointment"
            data-appointment-id="${appointment.id}"
            data-professional-id="${appointment.professional_id}"
          >
            Reagendar
          </button>
          <button
            class="btn-pill-outline btn-pill-danger"
            data-action="cancel-appointment"
            data-appointment-id="${appointment.id}"
          >
            Cancelar
          </button>
        </div>
      ` : ''}
    </div>
  `
}

function resolveSession() {
  return (getSessionFromStorage() ?? authStore.getSession()) ??
    authStore.refreshSession()
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

function getAppointmentDateTime(appointment: AppointmentSummary) {
  const dateTimeString = `${appointment.date}T${appointment.time}`
  return new Date(dateTimeString)
}

const doctorsGrid = document.getElementById("doctors-grid")
const toastContainer = document.getElementById("toast-container")
const filtersContainer = document.getElementById("filters-container")
const searchInput = document.getElementById("search-input") as
  | HTMLInputElement
  | null
const appointmentsStatus = document.getElementById("appointments-status")
const appointmentsList = document.getElementById("appointments-list")

type FiltersState = {
  specialty: string
  name: string
}

const filters: FiltersState = {
  specialty: "",
  name: "",
}

let professionalsCache: ProfessionalSummary[] = []

document.addEventListener("DOMContentLoaded", () => {
  hydrateSessionUser()
  renderFilters()
  bindSearchInput()
  loadProfessionals()
  loadPatientAppointments()
})

async function loadProfessionals() {
  if (!doctorsGrid) return

  const session = getSessionFromStorage() ?? authStore.getSession()
  if (!session) {
    redirectToLogin()
    return
  }

  const response = await listProfessionals({
    specialty: filters.specialty || undefined,
    name: filters.name || undefined,
  })

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar profissionais.",
    )
    renderToasts()
    doctorsGrid.innerHTML = buildEmptyState(
      "Não foi possível carregar profissionais agora.",
    )
    return
  }

  professionalsCache = response.data.data
  renderProfessionals(response.data.data)
  updateFiltersOptions(response.data.data)
}

const appointmentCountLabel = document.getElementById("appointments-count")

async function loadPatientAppointments(useCache = true) {
  if (!appointmentsList || !appointmentsStatus) return

  appointmentsStatus.textContent = "Sincronizando dados..."
  appointmentsList.innerHTML = buildAppointmentsLoadingState()

  const session = await resolveSession()
  if (!session) {
    redirectToLogin()
    return
  }

  const filters = session.role === "patient" ? { patientId: session.id } : {}
  const response = await listAppointments(filters, useCache)

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar seus agendamentos.",
    )
    renderToasts()
    appointmentsStatus.textContent = "Status indisponível"
    appointmentsList.innerHTML = buildAppointmentsEmptyState(
      "Não foi possível sincronizar seus agendamentos.",
      "Tente novamente em instantes.",
    )
    return
  }

  const appointments = response.data.appointments
  if (appointments.length === 0) {
    appointmentsStatus.textContent = "Nenhum agendamento encontrado"
    appointmentsList.innerHTML = buildAppointmentsEmptyState(
      "Você ainda não tem agendamentos.",
      "Agende sua primeira consulta.",
    )
    return
  }

  const now = new Date()
  const futureAppointments = appointments
    .map(appointment => ({
      ...appointment,
      dateTime: getAppointmentDateTime(appointment),
    }))
    .filter(
      appointment =>
        !Number.isNaN(appointment.dateTime.getTime()) &&
        appointment.dateTime >= now,
    )
    .sort(
      (a, b) =>
        a.dateTime.getTime() - b.dateTime.getTime(),
    )

  if (futureAppointments.length === 0) {
    appointmentsStatus.textContent = "Nenhum agendamento futuro"
    appointmentsList.innerHTML = buildAppointmentsEmptyState(
      "Você ainda não tem agendamentos futuros.",
      "Agende sua próxima consulta.",
    )
    return
  }

  // Contagem de agendamentos
  const limitedAppointments = futureAppointments.filter(a => a.status !== 'cancelled_by_patient')
  appointmentCountLabel!.textContent = `${limitedAppointments.length} agendamentos`
  appointmentsStatus.textContent = buildAppointmentStatusText(limitedAppointments)
  renderAppointmentCards(limitedAppointments)
}

function renderProfessionals(professionals: ProfessionalSummary[]) {
  if (!doctorsGrid) return

  if (professionals.length === 0) {
    doctorsGrid.innerHTML = buildEmptyState(
      "Nenhum profissional disponível no momento.",
    )
    return
  }

  doctorsGrid.innerHTML = professionals
    .map(professional => buildProfessionalCard(professional))
    .join("")

  doctorsGrid.querySelectorAll("[data-action='view-availability']").forEach(
    button => {
      button.addEventListener("click", async event => {
        const target = event.currentTarget as HTMLButtonElement
        const professionalId = Number(target.dataset.professionalId)
        if (!professionalId) return

        await handleAvailabilityClick(target, professionalId)
      })
    },
  )
}

function buildProfessionalCard(professional: ProfessionalSummary) {
  const council = professional.council ? `• ${professional.council}` : ""
  const registrationLabel = professional.registration_number
    ? `CRM ${professional.registration_number} ${council}`.trim()
    : "Registro a confirmar"

  return `
    <div class="professional-card">
      <div class="prof-card-top">
        <div class="prof-avatar" style="background-image: url('${professional.image || ''}')">
          ${!professional.image ? getInitials(professional.name) : ''}
        </div>
        <div class="prof-info">
          <div class="u-flex u-justify-between u-items-start">
            <div>
              <h3>${professional.name}</h3>
              <p class="prof-specialty">${professional.specialty}</p>
            </div>
            <div class="prof-rating">
              <span class="material-symbols-outlined star-icon">star</span>
              <span class="rating-value">4.9</span>
            </div>
          </div>
          <p class="u-text-secondary u-fs-xs u-mt-05">${registrationLabel}</p>
          <div class="prof-tags u-mt-10">
            <span class="prof-tag">Disponível hoje</span>
            <span class="prof-tag">${professional.specialty}</span>
          </div>
        </div>
      </div>

      <div class="prof-card-footer">
        <div class="prof-price">
          <span class="price-label">Consulta</span>
          <span class="price-value">${professional.consultation_price ? formatCurrency(professional.consultation_price) : "A confirmar"}</span>
        </div>
        <button
          class="btn-book"
          data-action="view-availability"
          data-professional-id="${professional.id}"
        >
          Agendar
        </button>
      </div>
    </div>
  `
}

let searchDebounceTimer: number | undefined

function renderFilters() {
  if (!filtersContainer) return

  filtersContainer.innerHTML = `
    <div class="flex flex-col gap-3">
      <label class="text-xs uppercase text-text-secondary">Especialidade</label>
      <select
        id="filter-specialty"
        class="h-12 rounded-lg bg-surface-dark border border-border-dark text-white px-3"
      >
        <option value="">Todas</option>
      </select>
    </div>
    <div class="flex flex-col gap-3">
      <label class="text-xs uppercase text-text-secondary">Nome do médico</label>
      <input
        id="filter-name"
        class="h-12 rounded-lg bg-surface-dark border border-border-dark text-white px-3"
        placeholder="Ex: Ana, João..."
        type="text"
      />
    </div>
    <button
      id="apply-filters"
      class="h-12 rounded-lg bg-primary text-white text-sm font-bold"
    >
      Aplicar filtros
    </button>
  `

  const specialtySelect = document.getElementById(
    "filter-specialty",
  ) as HTMLSelectElement | null
  const nameInput = document.getElementById(
    "filter-name",
  ) as HTMLInputElement | null
  const applyButton = document.getElementById(
    "apply-filters",
  ) as HTMLButtonElement | null

  if (specialtySelect) {
    specialtySelect.addEventListener("change", () => {
      filters.specialty = specialtySelect.value
    })
  }

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      filters.name = nameInput.value.trim()
    })
  }

  if (applyButton) {
    applyButton.addEventListener("click", async () => {
      await loadProfessionals()
    })
  }
}

function updateFiltersOptions(professionals: ProfessionalSummary[]) {
  const specialtySelect = document.getElementById(
    "filter-specialty",
  ) as HTMLSelectElement | null

  if (!specialtySelect) return

  const specialties = Array.from(
    new Set(professionals.map(item => item.specialty).filter(Boolean)),
  )
  specialties.sort((a, b) => a.localeCompare(b))

  const currentValue = specialtySelect.value
  specialtySelect.innerHTML = [
    "<option value=\"\">Todas</option>",
    ...specialties.map(
      specialty =>
        `<option value="${specialty}">${specialty}</option>`,
    ),
  ].join("")

  specialtySelect.value = currentValue
}

function bindSearchInput() {
  if (!searchInput) return
  searchInput.addEventListener("input", async () => {
    filters.name = searchInput.value.trim()
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    searchDebounceTimer = window.setTimeout(async () => {
      await loadProfessionals()
    }, 300)
  })
}

async function handleAvailabilityClick(
  button: HTMLButtonElement,
  professionalId: number,
) {
  const originalText = button.innerHTML
  button.disabled = true
  button.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> Agendando...`

  const response = await getProfessionalAvailability(professionalId, {
    daysAhead: 7,
  })

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar os horários.",
    )
    renderToasts()
    button.innerHTML = originalText
    button.disabled = false
    return
  }

  const futureSlots = response.data
    .filter(slot => slot.is_available)
    .filter(slot => {
      const slotDate = new Date(`${slot.date}T${slot.time}`)
      return slotDate.getTime() > Date.now()
    })
  uiStore.addToast(
    "success",
    futureSlots.length
      ? `Encontramos ${futureSlots.length} horários disponíveis.`
      : "Nenhum horário disponível para os próximos dias.",
  )
  renderToasts()
  
  const professional = professionalsCache.find(p => p.id === professionalId)
  if (!professional) return

  createAvailabilityModal(professional, futureSlots)

  button.innerHTML = originalText
  button.disabled = false
}





function buildEmptyState(message: string) {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <span class="material-symbols-outlined text-4xl text-text-secondary mb-2">search_off</span>
      <h3 class="text-lg font-bold text-white">${message}</h3>
      <p class="text-text-secondary">Tente novamente em instantes.</p>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function renderToasts() {
  if (!toastContainer) return
  toastContainer.innerHTML = ""
  uiStore.getToasts().forEach(toast => {
    const toastElement = document.createElement("div")
    toastElement.className = `toast-item toast-item-${toast.level || 'info'}`
    toastElement.textContent = toast.text
    toastContainer.appendChild(toastElement)
  })
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

function clearFilters() {
  filters.specialty = ""
  filters.name = ""

  if (searchInput) searchInput.value = ""

  const specialtySelect = document.getElementById(
    "filter-specialty",
  ) as HTMLSelectElement | null
  const nameInput = document.getElementById(
    "filter-name",
  ) as HTMLInputElement | null

  if (specialtySelect) specialtySelect.value = ""
  if (nameInput) nameInput.value = ""

  loadProfessionals()
}

function createCheckoutModal(
  professional: ProfessionalSummary,
  date: string,
  time: string,
) {
  const existing = document.getElementById("checkout-modal")
  if (existing) existing.remove()

  const modal = document.createElement("div")
  modal.id = "checkout-modal"
  modal.className =
    "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  modal.innerHTML = `
    <div class="bg-surface-dark border border-border-dark rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-4 border-b border-border-dark flex justify-between items-center bg-background-dark">
        <h3 class="text-white font-bold">Resumo do Agendamento</h3>
        <button data-action="close-checkout" class="text-text-secondary hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="p-6 flex flex-col gap-6">
        <div class="flex gap-4 items-center">
          <div class="size-16 rounded-full bg-primary/10 border border-border-dark flex items-center justify-center text-primary text-lg font-bold">
            ${getInitials(professional.name)}
          </div>
          <div>
            <h4 class="text-white font-bold text-lg">${professional.name}</h4>
            <p class="text-primary text-sm">${professional.specialty}</p>
          </div>
        </div>

        <div class="bg-background-dark rounded-lg p-4 border border-border-dark space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">Data</span>
            <span class="text-white font-medium">${formatDateFull(date)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">Horário</span>
            <span class="text-white font-medium">${time}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">Local</span>
            <span class="text-white font-medium">Unidade principal</span>
          </div>
          <div class="h-px bg-border-dark my-2"></div>
          <div class="flex justify-between text-base">
            <span class="text-white font-bold">Valor Total</span>
            <span class="text-primary font-bold">${
              professional.consultation_price
                ? formatCurrency(professional.consultation_price)
                : "A confirmar"
            }</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary uppercase mb-2">Forma de Pagamento</label>
          <div class="grid grid-cols-2 gap-2">
            <button class="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary">
              <span class="material-symbols-outlined">credit_card</span>
              Crédito
            </button>
            <button class="flex items-center justify-center gap-2 p-3 rounded-lg border border-border-dark bg-background-dark text-text-secondary hover:text-white hover:border-text-secondary transition-colors">
              <span class="material-symbols-outlined">pix</span>
              PIX
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary uppercase mb-2">Parcelamento</label>
          <select class="w-full bg-background-dark border border-border-dark text-white rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary">
            <option value="1">1x sem juros</option>
            <option value="2">2x sem juros</option>
          </select>
        </div>

        <button data-action="checkout-confirm" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2">
          <span class="material-symbols-outlined">lock</span>
          Pagar e Confirmar
        </button>
      </div>
    </div>
  `

  modal.querySelector("[data-action='close-checkout']")?.addEventListener(
    "click",
    () => {
      modal.remove()
    },
  )

  const confirmButton = modal.querySelector(
    "[data-action='checkout-confirm']",
  ) as HTMLButtonElement | null

  confirmButton?.addEventListener("click", async () => {
    if (!confirmButton) return
    const originalText = confirmButton.textContent
    confirmButton.disabled = true
    confirmButton.textContent = "Confirmando..."

    try {
      const session = await resolveSession()
      if (!session) {
        redirectToLogin()
        return
      }

      const response = await createAppointment({
        patientId: session.id,
        professionalId: professional.id,
        date,
        time,
        type: "presencial",
        price: professional.consultation_price ?? 0,
      })

      if (!response.success) {
        const errorMessage = response.error
          ? mapAppointmentError(response.error)
          : "Não foi possível confirmar o agendamento."
        uiStore.addToast("error", errorMessage)
        renderToasts()
        return
      }

      uiStore.addToast(
        "success",
        `Agendamento confirmado para ${formatDateFull(date)} às ${time}.`,
      )
      renderToasts()
      modal.remove()
      
      // Force reload of appointments list with fresh data
      await loadPatientAppointments(false)
      
      // Reload dashboard for patient dashboard page
      await dashboardStore.loadData()
    } finally {
      confirmButton.disabled = false
      confirmButton.textContent = originalText ?? "Pagar e Confirmar"
    }
  })

  document.body.appendChild(modal)
}

async function handleCancelAppointment(appointmentId: number) {
  const confirmed = confirm(
    "Tem certeza que deseja cancelar este agendamento? Reembolsos podem variar conforme a antecedência.",
  )
  if (!confirmed) return

  const response = await cancelAppointment(appointmentId)

  if (!response.success) {
    const errorMessage = response.error
      ? mapAppointmentError(response.error)
      : "Não foi possível cancelar o agendamento."
    uiStore.addToast("error", errorMessage)
    renderToasts()
    return
  }

  const refundInfo =
    response.data?.refund
      ? ` Reembolso de ${response.data.refund.percentage}% (${formatCurrency(response.data.refund.amount)}) será processado.`
      : ""

  uiStore.addToast("success", `Agendamento cancelado com sucesso.${refundInfo}`)
  renderToasts()
  await loadPatientAppointments(false)
  
  // Reload dashboard for patient dashboard page
  await dashboardStore.loadData()
}

function formatDateFull(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function createAvailabilityModal(
  professional: ProfessionalSummary,
  availability: ProfessionalAvailabilityEntry[],
) {
  const existing = document.getElementById("availability-modal")
  if (existing) existing.remove()

  // Group slots by date
  const slotsByDate = availability.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, typeof availability>)

  const modal = document.createElement("div")
  modal.id = "availability-modal"
  modal.className =
    "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  
  // Generate HTML for grouped slots
  const slotsHtml = Object.entries(slotsByDate).map(([date, slots]) => `
    <div class="mb-6 last:mb-0">
      <h4 class="text-white font-medium mb-3 sticky top-0 bg-surface-dark py-2 border-b border-border-dark flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-sm">calendar_month</span>
        <span class="capitalize">${formatDateFull(date)}</span>
      </h4>
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        ${slots.map(slot => `
          <button
            class="p-2 bg-background-dark border border-border-dark hover:border-primary hover:bg-primary/10 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md group"
            data-action="select-slot"
            data-slot-date="${slot.date}"
            data-slot-time="${slot.time}"
          >
            <span class="group-hover:scale-110 block transition-transform text-primary">${slot.time}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `).join("")

  modal.innerHTML = `
    <div class="bg-surface-dark border border-border-dark rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-4 border-b border-border-dark flex justify-between items-center bg-background-dark z-10 relative">
        <div class="flex items-center gap-3">
           <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
              ${getInitials(professional.name)}
           </div>
           <div>
              <h3 class="text-white font-bold text-lg">Agendar com ${professional.name}</h3>
              <p class="text-primary text-xs font-medium">${professional.specialty}</p>
           </div>
        </div>
        <button data-action="close-availability" class="text-text-secondary hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="p-6 flex flex-col gap-4">
        <p class="text-sm text-text-secondary">
          Selecione um horário para confirmar seu agendamento:
        </p>

        <div class="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          ${availability.length > 0 ? slotsHtml : `<div class="text-center text-text-secondary py-8">Nenhum horário disponível para os próximos dias.</div>`}
        </div>
      </div>
    </div>
  `

  modal.querySelector("[data-action='close-availability']")?.addEventListener(
    "click",
    () => {
      modal.remove()
    },
  )

  modal.querySelectorAll("[data-action='select-slot']").forEach(button => {
    button.addEventListener("click", event => {
      const target = event.currentTarget as HTMLButtonElement
      const selectedDate = target.dataset.slotDate
      const selectedTime = target.dataset.slotTime
      
      if (!selectedDate || !selectedTime) return

      createCheckoutModal(professional, selectedDate, selectedTime)
      modal.remove()
    })
  })

  document.body.appendChild(modal)
}

async function handleRescheduleClick(appointmentId: number, professionalId: number) {
  const response = await getProfessionalAvailability(professionalId, {
    daysAhead: 7,
  })

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar os horários disponíveis.",
    )
    renderToasts()
    return
  }

  const futureSlots = response.data
    .filter(slot => slot.is_available)
    .filter(slot => {
      const slotDate = new Date(`${slot.date}T${slot.time}`)
      return slotDate.getTime() > Date.now()
    })

  if (futureSlots.length === 0) {
    uiStore.addToast(
      "error",
      "Não há horários disponíveis para reagendamento no momento.",
    )
    renderToasts()
    return
  }

  createRescheduleModal(appointmentId, futureSlots)
}

function createRescheduleModal(
  appointmentId: number,
  availability: ProfessionalAvailabilityEntry[],
) {
  const existing = document.getElementById("reschedule-modal")
  if (existing) existing.remove()

  const modal = document.createElement("div")
  modal.id = "reschedule-modal"
  modal.className =
    "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  modal.innerHTML = `
    <div class="bg-surface-dark border border-border-dark rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-4 border-b border-border-dark flex justify-between items-center bg-background-dark">
        <h3 class="text-white font-bold">Reagendar Consulta</h3>
        <button data-action="close-reschedule" class="text-text-secondary hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="p-6 flex flex-col gap-4">
        <p class="text-sm text-text-secondary">
          Selecione um novo horário disponível para reagendar sua consulta:
        </p>

        <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          ${availability.slice(0, 20).map(
            slot => `
              <button
                class="p-4 bg-background-dark border border-border-dark hover:border-primary hover:bg-primary/10 text-white rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-2"
                data-action="select-reschedule-slot"
                data-slot-date="${slot.date}"
                data-slot-time="${slot.time}"
              >
                <span class="material-symbols-outlined text-primary">calendar_month</span>
                <span>${formatDateFull(slot.date)}</span>
                <span class="text-primary font-bold">${slot.time}</span>
              </button>
            `,
          ).join("")}
        </div>
      </div>
    </div>
  `

  modal.querySelector("[data-action='close-reschedule']")?.addEventListener(
    "click",
    () => {
      modal.remove()
    },
  )

  modal.querySelectorAll("[data-action='select-reschedule-slot']").forEach(button => {
    button.addEventListener("click", async event => {
      const target = event.currentTarget as HTMLButtonElement
      const newDate = target.dataset.slotDate
      const newTime = target.dataset.slotTime
      if (!newDate || !newTime) return

      await handleRescheduleConfirm(appointmentId, newDate, newTime, modal)
    })
  })

  document.body.appendChild(modal)
}

async function handleRescheduleConfirm(
  appointmentId: number,
  newDate: string,
  newTime: string,
  modal: HTMLElement,
) {
  const confirmed = confirm(
    `Confirmar reagendamento para ${formatDateFull(newDate)} às ${newTime}?`,
  )
  if (!confirmed) return

  const response = await rescheduleAppointment(appointmentId, {
    newDate,
    newTime,
  })

  if (!response.success) {
    const errorMessage = response.error
      ? mapAppointmentError(response.error)
      : "Não foi possível reagendar o agendamento."
    uiStore.addToast("error", errorMessage)
    renderToasts()
    return
  }

  uiStore.addToast(
    "success",
    `Consulta reagendada com sucesso para ${formatDateFull(newDate)} às ${newTime}.`,
  )
  renderToasts()
  modal.remove()
  await loadPatientAppointments(false)
  
  // Reload dashboard for patient dashboard page
  await dashboardStore.loadData()
}

(window as Window & { clearFilters?: () => void }).clearFilters = clearFilters
