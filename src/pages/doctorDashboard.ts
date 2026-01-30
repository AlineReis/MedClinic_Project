import { listAppointments } from "../services/appointmentsService"
import { createExam } from "../services/examsService"
import { createPrescription, listPrescriptions } from "../services/prescriptionsService"
import { createProfessionalAvailability, getProfessionalCommissions } from "../services/professionalsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { AppointmentSummary } from "../types/appointments"
import type { CreateExamPayload } from "../types/exams"
import type { CreatePrescriptionPayload, PrescriptionSummary } from "../types/prescriptions"
import type { AvailabilityInput, CommissionsResponse } from "../types/professionals"

async function initDoctorDashboard() {
  const session = await authStore.refreshSession()

  if (!session || session.role !== "health_professional") {
    uiStore.addToast("error", "Acesso negado. Apenas profissionais de saúde podem acessar esta página.")
    window.location.href = "/pages/login.html"
    return
  }

  // Update header with user info
  updateHeader(session)

  // Load upcoming appointments
  await loadUpcomingAppointments(session.id)

  // Load commissions data for current month
  const currentMonth = new Date().getMonth() + 1
  await loadCommissions(session.id, currentMonth)

  // Setup commission filter listeners
  setupCommissionFilters(session.id)

  // Load recent prescriptions
  await loadPrescriptions(session.id)

  // Setup availability management
  setupAvailabilityManagement(session.id)

  // Setup exam request
  setupExamRequest(session.id)

  // Setup prescription creation
  setupPrescriptionCreation(session.id)
}

function updateHeader(session: { name?: string; role: string; email: string }) {
  const nameElement = document.querySelector("[data-user-name]")
  const roleElement = document.querySelector("[data-user-role]")
  const initialsElement = document.querySelector("[data-user-initials]")

  if (nameElement) {
    nameElement.textContent = session.name || session.email.split("@")[0]
  }

  if (roleElement) {
    roleElement.textContent = "Profissional de Saúde"
  }

  if (initialsElement) {
    const name = session.name || session.email
    const initials = name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    initialsElement.textContent = initials
  }
}

async function loadUpcomingAppointments(professionalId: number) {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    // Get today's appointments
    const todayResponse = await listAppointments({
      professionalId,
      date: todayStr,
      status: "scheduled,confirmed",
    })

    // Get all upcoming appointments
    const upcomingResponse = await listAppointments({
      professionalId,
      upcoming: true,
    })

    if (todayResponse.success && upcomingResponse.success && todayResponse.data && upcomingResponse.data) {
      const todayAppointments = todayResponse.data.appointments
      const allUpcoming = upcomingResponse.data.appointments

      updateStats(todayAppointments, allUpcoming)
      updateNextPatient(todayAppointments)
      updateWaitingQueue(todayAppointments)
    } else {
      uiStore.addToast("error", "Erro ao carregar agendamentos")
    }
  } catch (error) {
    console.error("Error loading appointments:", error)
    uiStore.addToast("error", "Erro ao carregar agendamentos")
  }
}

function updateStats(todayAppointments: AppointmentSummary[], allUpcoming: AppointmentSummary[]) {
  // Count today's appointments
  const totalToday = todayAppointments.length

  // Count appointments by status
  const waiting = todayAppointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length
  const completed = todayAppointments.filter(a => a.status === "completed").length

  // Note: 'type' field is not in AppointmentSummary yet, so we'll show 0 for now
  const telemedicine = 0

  // Update stat cards
  const statsCards = document.querySelectorAll("section.grid h3")
  if (statsCards[0]) statsCards[0].textContent = String(totalToday)
  if (statsCards[1]) statsCards[1].textContent = String(waiting)
  if (statsCards[2]) statsCards[2].textContent = String(completed)
  if (statsCards[3]) statsCards[3].textContent = String(telemedicine)
}

function updateNextPatient(appointments: AppointmentSummary[]) {
  if (appointments.length === 0) {
    // Show empty state
    const nextPatientCard = document.querySelector(".from-primary")
    if (nextPatientCard) {
      nextPatientCard.innerHTML = `
        <div class="text-center py-8">
          <span class="material-symbols-outlined text-6xl opacity-20">event_available</span>
          <p class="mt-4 text-lg">Nenhum paciente agendado para hoje</p>
        </div>
      `
    }
    return
  }

  // Sort by time and get the next one
  const sortedAppointments = [...appointments].sort((a, b) => {
    return a.time.localeCompare(b.time)
  })

  const nextAppointment = sortedAppointments[0]
  const nextPatientCard = document.querySelector(".from-primary")

  if (nextPatientCard) {
    nextPatientCard.innerHTML = `
      <span class="text-[10px] font-bold uppercase bg-white/20 px-2 py-1 rounded">Próximo Paciente</span>
      <h3 class="text-2xl font-bold mt-4">${nextAppointment.patient_name || "Paciente"}</h3>
      <p class="text-sm opacity-80">Consulta • ${nextAppointment.specialty || "Profissional"}</p>
      <div class="flex gap-4 mt-6 text-sm">
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">schedule</span> ${nextAppointment.time}
        </span>
        ${nextAppointment.room ? `
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">location_on</span> Sala ${nextAppointment.room}
          </span>
        ` : ""}
      </div>
      <button onclick="window.location.href='pep.html'"
        class="mt-8 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-slate-100 transition-all">
        Iniciar Atendimento
      </button>
    `
  }
}

function updateWaitingQueue(appointments: AppointmentSummary[]) {
  const queueList = document.querySelector(".bg-surface-dark ul")
  if (!queueList) return

  // Filter appointments that are waiting (after the first one)
  const sortedAppointments = [...appointments]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(1, 5) // Show next 4 appointments

  if (sortedAppointments.length === 0) {
    queueList.innerHTML = `
      <li class="flex items-center justify-center p-6 bg-background-dark/50 rounded-xl">
        <span class="text-sm text-slate-500">Nenhum paciente na fila</span>
      </li>
    `
    return
  }

  queueList.innerHTML = sortedAppointments
    .map(
      appointment => `
      <li class="flex items-center justify-between p-3 bg-background-dark/50 rounded-xl">
        <span class="text-sm font-medium">${appointment.patient_name || "Paciente"}</span>
        <span class="text-xs ${appointment.status === "confirmed" ? "text-amber-500" : "text-slate-500"} font-bold">
          ${appointment.time}
        </span>
      </li>
    `,
    )
    .join("")
}

async function loadCommissions(professionalId: number, month?: number, status?: "pending" | "paid") {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()

    const response = await getProfessionalCommissions(professionalId, {
      month,
      year: currentYear,
      status,
    })

    if (response.success && response.data) {
      updateCommissionsPanel(response.data)
    } else {
      console.error("Failed to load commissions:", response.error)
    }
  } catch (error) {
    console.error("Error loading commissions:", error)
  }
}

function setupCommissionFilters(professionalId: number) {
  const monthFilter = document.getElementById("commissions-month-filter") as HTMLSelectElement
  const statusFilter = document.getElementById("commissions-status-filter") as HTMLSelectElement

  if (!monthFilter || !statusFilter) return

  // Set current month as default
  const currentMonth = new Date().getMonth() + 1
  monthFilter.value = String(currentMonth)

  const handleFilterChange = () => {
    const month = monthFilter.value ? Number(monthFilter.value) : undefined
    const status = statusFilter.value ? (statusFilter.value as "pending" | "paid") : undefined
    loadCommissions(professionalId, month, status)
  }

  monthFilter.addEventListener("change", handleFilterChange)
  statusFilter.addEventListener("change", handleFilterChange)
}

function updateCommissionsPanel(data: CommissionsResponse) {
  const totalElement = document.querySelector("[data-commission-total]")
  const pendingElement = document.querySelector("[data-commission-pending]")
  const paidElement = document.querySelector("[data-commission-paid]")
  const detailsSection = document.querySelector("[data-commissions-details]")

  if (!totalElement || !pendingElement || !paidElement || !detailsSection) return

  const { summary, details } = data

  // Update summary values using data attributes
  totalElement.textContent = `R$ ${formatCurrency(summary.total)}`
  pendingElement.textContent = `R$ ${formatCurrency(summary.pending)}`
  paidElement.textContent = `R$ ${formatCurrency(summary.paid)}`

  // Update details list
  if (details.length === 0) {
    detailsSection.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-sm">
        Nenhuma comissão encontrada
      </div>
    `
    return
  }

  // Render all commission details (the container has max-height with scroll)
  detailsSection.innerHTML = details
    .map(
      commission => `
    <div class="flex items-center justify-between p-3 bg-surface-dark/30 rounded-lg hover:bg-surface-dark/50 transition-colors">
      <div class="flex-1">
        <p class="text-sm font-medium">Consulta #${commission.appointment_id}</p>
        <p class="text-xs text-slate-500">${formatDate(commission.created_at)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-bold">R$ ${formatCurrency(commission.amount)}</p>
        <span class="text-xs px-2 py-0.5 rounded ${commission.status === "paid" ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}">
          ${commission.status === "paid" ? "Pago" : "Pendente"}
        </span>
      </div>
    </div>
  `,
    )
    .join("")
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace(".", ",")
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

async function loadPrescriptions(professionalId: number) {
  try {
    const response = await listPrescriptions({ professionalId })

    if (response.success && response.data) {
      updatePrescriptionsPanel(response.data)
    } else {
      console.error("Failed to load prescriptions:", response.error)
    }
  } catch (error) {
    console.error("Error loading prescriptions:", error)
  }
}

function updatePrescriptionsPanel(prescriptions: PrescriptionSummary[]) {
  const prescriptionsSection = document.querySelector("[data-prescriptions-list]")

  if (!prescriptionsSection) return

  if (prescriptions.length === 0) {
    prescriptionsSection.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-sm">
        Nenhuma prescrição encontrada
      </div>
    `
    return
  }

  // Display the 5 most recent prescriptions
  prescriptionsSection.innerHTML = prescriptions
    .slice(0, 5)
    .map(
      prescription => `
    <div class="flex items-center justify-between p-3 bg-surface-dark/30 rounded-lg hover:bg-surface-dark/50 transition-colors">
      <div class="flex-1">
        <p class="text-sm font-medium">${prescription.medication_name}</p>
        <p class="text-xs text-slate-500">${formatDate(prescription.created_at)}</p>
        ${prescription.dosage ? `<p class="text-xs text-slate-400 mt-1">${prescription.dosage}</p>` : ""}
      </div>
      <div class="text-right">
        ${prescription.quantity ? `<p class="text-sm font-medium">${prescription.quantity}x</p>` : ""}
      </div>
    </div>
  `,
    )
    .join("")
}

function setupAvailabilityManagement(professionalId: number) {
  const addButton = document.getElementById("add-availability-button")
  if (!addButton) return

  addButton.addEventListener("click", () => showAvailabilityModal(professionalId))
}

function showAvailabilityModal(professionalId: number) {
  const modal = document.createElement("div")
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  modal.innerHTML = `
    <div class="bg-surface-dark border border-border-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold">Adicionar Horários de Disponibilidade</h3>
        <button id="close-availability-modal" class="text-slate-400 hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="space-y-4">
        <div id="availability-entries" class="space-y-4">
          <div class="availability-entry bg-background-dark/50 p-4 rounded-xl border border-border-dark">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs text-slate-400 mb-2">Dia da Semana</label>
                <select class="day-select w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white">
                  <option value="0">Domingo</option>
                  <option value="1" selected>Segunda</option>
                  <option value="2">Terça</option>
                  <option value="3">Quarta</option>
                  <option value="4">Quinta</option>
                  <option value="5">Sexta</option>
                  <option value="6">Sábado</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-2">Início</label>
                <input type="time" class="start-time w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white" value="09:00" />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-2">Fim</label>
                <input type="time" class="end-time w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white" value="12:00" />
              </div>
              <div class="flex items-end">
                <button class="remove-entry w-full px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors">
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>

        <button id="add-more-entry" class="w-full px-4 py-3 bg-background-dark border border-dashed border-border-dark rounded-xl text-sm text-slate-400 hover:text-white hover:border-primary transition-colors flex items-center justify-center gap-2">
          <span class="material-symbols-outlined">add</span> Adicionar Mais Horário
        </button>

        <div class="flex gap-3 pt-4">
          <button id="cancel-availability" class="flex-1 px-6 py-3 bg-background-dark border border-border-dark rounded-xl font-bold hover:bg-border-dark transition-colors">
            Cancelar
          </button>
          <button id="save-availability" class="flex-1 px-6 py-3 bg-primary rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Salvar Horários
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Close modal handlers
  const closeButton = modal.querySelector("#close-availability-modal")
  const cancelButton = modal.querySelector("#cancel-availability")
  const closeModal = () => modal.remove()

  closeButton?.addEventListener("click", closeModal)
  cancelButton?.addEventListener("click", closeModal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal()
  })

  // Add more entry
  const addMoreButton = modal.querySelector("#add-more-entry")
  addMoreButton?.addEventListener("click", () => {
    const entriesContainer = modal.querySelector("#availability-entries")
    if (!entriesContainer) return

    const newEntry = document.createElement("div")
    newEntry.className = "availability-entry bg-background-dark/50 p-4 rounded-xl border border-border-dark"
    newEntry.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-2">Dia da Semana</label>
          <select class="day-select w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white">
            <option value="0">Domingo</option>
            <option value="1" selected>Segunda</option>
            <option value="2">Terça</option>
            <option value="3">Quarta</option>
            <option value="4">Quinta</option>
            <option value="5">Sexta</option>
            <option value="6">Sábado</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-2">Início</label>
          <input type="time" class="start-time w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white" value="09:00" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-2">Fim</label>
          <input type="time" class="end-time w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white" value="12:00" />
        </div>
        <div class="flex items-end">
          <button class="remove-entry w-full px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors">
            Remover
          </button>
        </div>
      </div>
    `
    entriesContainer.appendChild(newEntry)
    setupRemoveHandlers()
  })

  // Remove entry handlers
  function setupRemoveHandlers() {
    const removeButtons = modal.querySelectorAll(".remove-entry")
    removeButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        const entry = (e.target as HTMLElement).closest(".availability-entry")
        const entriesContainer = modal.querySelector("#availability-entries")
        if (entry && entriesContainer && entriesContainer.children.length > 1) {
          entry.remove()
        } else {
          uiStore.addToast("error", "Você precisa manter pelo menos um horário")
        }
      })
    })
  }
  setupRemoveHandlers()

  // Save handler
  const saveButton = modal.querySelector("#save-availability")
  saveButton?.addEventListener("click", async () => {
    const entries = modal.querySelectorAll(".availability-entry")
    const availabilities: AvailabilityInput[] = []

    entries.forEach(entry => {
      const daySelect = entry.querySelector(".day-select") as HTMLSelectElement
      const startTime = entry.querySelector(".start-time") as HTMLInputElement
      const endTime = entry.querySelector(".end-time") as HTMLInputElement

      if (daySelect && startTime && endTime) {
        // Validation
        if (startTime.value >= endTime.value) {
          uiStore.addToast("error", "Horário de início deve ser antes do horário de fim")
          return
        }

        availabilities.push({
          day_of_week: Number(daySelect.value),
          start_time: startTime.value,
          end_time: endTime.value,
          is_active: true,
        })
      }
    })

    if (availabilities.length === 0) {
      uiStore.addToast("error", "Adicione pelo menos um horário")
      return
    }

    // Disable save button
    if (saveButton) {
      saveButton.textContent = "Salvando..."
      ;(saveButton as HTMLButtonElement).disabled = true
    }

    try {
      const response = await createProfessionalAvailability(professionalId, availabilities)

      if (response.success && response.data) {
        uiStore.addToast("success", `${response.data.data.length} horário(s) cadastrado(s) com sucesso!`)
        closeModal()
        // Refresh availability list (when implemented)
      } else if (response.error) {
        if (response.error.code === "OVERLAPPING_TIMES") {
          uiStore.addToast("error", "Horários sobrepostos: " + response.error.message)
        } else {
          uiStore.addToast("error", response.error.message || "Erro ao salvar horários")
        }
      }
    } catch (error) {
      console.error("Error saving availability:", error)
      uiStore.addToast("error", "Erro ao salvar horários")
    } finally {
      if (saveButton) {
        saveButton.textContent = "Salvar Horários"
        ;(saveButton as HTMLButtonElement).disabled = false
      }
    }
  })
}

function setupExamRequest(professionalId: number) {
  const requestButton = document.getElementById("request-exam-button")
  if (!requestButton) return

  requestButton.addEventListener("click", () => showExamRequestModal(professionalId))
}

function showExamRequestModal(professionalId: number) {
  const modal = document.createElement("div")
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  modal.innerHTML = `
    <div class="bg-surface-dark border border-border-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold">Solicitar Exame</h3>
        <button id="close-exam-modal" class="text-slate-400 hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="exam-request-form" class="space-y-4">
        <div>
          <label class="block text-sm text-slate-400 mb-2">ID da Consulta *</label>
          <input type="number" id="exam-appointment-id" required
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Digite o ID da consulta" />
          <p class="text-xs text-slate-500 mt-1">Obtenha o ID na fila de atendimento ou histórico</p>
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">ID do Paciente *</label>
          <input type="number" id="exam-patient-id" required
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Digite o ID do paciente" />
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Nome do Exame *</label>
          <input type="text" id="exam-name" required
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Ex: Hemograma Completo" />
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Valor do Exame (R$) *</label>
          <input type="number" id="exam-price" required step="0.01" min="0"
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="150.00" />
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Indicação Clínica *</label>
          <textarea id="exam-clinical-indication" required rows="4"
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none"
            placeholder="Descreva a justificativa clínica para o exame..."></textarea>
          <p class="text-xs text-slate-500 mt-1">Justifique clinicamente a necessidade do exame</p>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" id="cancel-exam-request" class="flex-1 px-6 py-3 bg-background-dark border border-border-dark rounded-xl font-bold hover:bg-border-dark transition-colors">
            Cancelar
          </button>
          <button type="submit" id="submit-exam-request" class="flex-1 px-6 py-3 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            Solicitar Exame
          </button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)

  // Close modal handlers
  const closeButton = modal.querySelector("#close-exam-modal")
  const cancelButton = modal.querySelector("#cancel-exam-request")
  const closeModal = () => modal.remove()

  closeButton?.addEventListener("click", closeModal)
  cancelButton?.addEventListener("click", closeModal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal()
  })

  // Form submission
  const form = modal.querySelector("#exam-request-form") as HTMLFormElement
  const submitButton = modal.querySelector("#submit-exam-request") as HTMLButtonElement

  form?.addEventListener("submit", async (e) => {
    e.preventDefault()

    const appointmentId = Number((document.getElementById("exam-appointment-id") as HTMLInputElement).value)
    const patientId = Number((document.getElementById("exam-patient-id") as HTMLInputElement).value)
    const examName = (document.getElementById("exam-name") as HTMLInputElement).value.trim()
    const examPrice = Number((document.getElementById("exam-price") as HTMLInputElement).value)
    const clinicalIndication = (document.getElementById("exam-clinical-indication") as HTMLTextAreaElement).value.trim()

    // Validation
    if (!appointmentId || !patientId || !examName || !examPrice || !clinicalIndication) {
      uiStore.addToast("error", "Preencha todos os campos obrigatórios")
      return
    }

    if (examPrice <= 0) {
      uiStore.addToast("error", "O valor do exame deve ser maior que zero")
      return
    }

    // Disable submit button
    submitButton.textContent = "Solicitando..."
    submitButton.disabled = true

    try {
      const payload: CreateExamPayload = {
        appointment_id: appointmentId,
        patient_id: patientId,
        exam_name: examName,
        exam_price: examPrice,
        clinical_indication: clinicalIndication,
      }

      const response = await createExam(payload)

      if (response.success && response.data) {
        uiStore.addToast("success", `Exame "${examName}" solicitado com sucesso!`)
        closeModal()
      } else if (response.error) {
        const errorMessage = getExamErrorMessage(response.error.code)
        uiStore.addToast("error", errorMessage || response.error.message || "Erro ao solicitar exame")
      }
    } catch (error) {
      console.error("Error creating exam:", error)
      uiStore.addToast("error", "Erro inesperado ao solicitar exame")
    } finally {
      submitButton.textContent = "Solicitar Exame"
      submitButton.disabled = false
    }
  })
}

function getExamErrorMessage(errorCode?: string): string | undefined {
  const errorMessages: Record<string, string> = {
    EXAM_NOT_FOUND: "Exame não encontrado",
    FORBIDDEN: "Você não tem permissão para solicitar exames",
    INVALID_APPOINTMENT_ID: "ID de consulta inválido",
    APPOINTMENT_NOT_FOUND: "Consulta não encontrada",
    PATIENT_NOT_FOUND: "Paciente não encontrado",
    UNAUTHORIZED: "Você precisa estar autenticado",
  }

  return errorCode ? errorMessages[errorCode] : undefined
}

function setupPrescriptionCreation(professionalId: number) {
  const createButton = document.getElementById("create-prescription-button")
  if (!createButton) return

  createButton.addEventListener("click", () => showPrescriptionModal(professionalId))
}

function showPrescriptionModal(professionalId: number) {
  const modal = document.createElement("div")
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  modal.innerHTML = `
    <div class="bg-surface-dark border border-border-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold">Nova Prescrição</h3>
        <button id="close-prescription-modal" class="text-slate-400 hover:text-white">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="prescription-form" class="space-y-4">
        <div>
          <label class="block text-sm text-slate-400 mb-2">ID da Consulta *</label>
          <input type="number" id="prescription-appointment-id" required
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Digite o ID da consulta" />
          <p class="text-xs text-slate-500 mt-1">Obtenha o ID na fila de atendimento ou histórico</p>
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">ID do Paciente *</label>
          <input type="number" id="prescription-patient-id" required
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Digite o ID do paciente" />
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Nome do Medicamento *</label>
          <input type="text" id="prescription-medication-name" required
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Ex: Amoxicilina 500mg" />
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Dosagem</label>
          <input type="text" id="prescription-dosage"
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Ex: 500mg" />
          <p class="text-xs text-slate-500 mt-1">Opcional - especifique a dosagem do medicamento</p>
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Frequência</label>
          <input type="text" id="prescription-frequency"
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Ex: 3x ao dia" />
          <p class="text-xs text-slate-500 mt-1">Opcional - quantas vezes por dia/semana</p>
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Duração (dias)</label>
          <input type="number" id="prescription-duration-days" min="1"
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            placeholder="Ex: 7" />
          <p class="text-xs text-slate-500 mt-1">Opcional - quantos dias de tratamento</p>
        </div>

        <div>
          <label class="block text-sm text-slate-400 mb-2">Instruções</label>
          <textarea id="prescription-instructions" rows="3"
            class="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none"
            placeholder="Ex: Tomar após as refeições com água"></textarea>
          <p class="text-xs text-slate-500 mt-1">Opcional - orientações adicionais para o paciente</p>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" id="cancel-prescription" class="flex-1 px-6 py-3 bg-background-dark border border-border-dark rounded-xl font-bold hover:bg-border-dark transition-colors">
            Cancelar
          </button>
          <button type="submit" id="submit-prescription" class="flex-1 px-6 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-700 transition-colors">
            Criar Prescrição
          </button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)

  // Close modal handlers
  const closeButton = modal.querySelector("#close-prescription-modal")
  const cancelButton = modal.querySelector("#cancel-prescription")
  const closeModal = () => modal.remove()

  closeButton?.addEventListener("click", closeModal)
  cancelButton?.addEventListener("click", closeModal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal()
  })

  // Form submission
  const form = modal.querySelector("#prescription-form") as HTMLFormElement
  const submitButton = modal.querySelector("#submit-prescription") as HTMLButtonElement

  form?.addEventListener("submit", async (e) => {
    e.preventDefault()

    const appointmentId = Number((document.getElementById("prescription-appointment-id") as HTMLInputElement).value)
    const patientId = Number((document.getElementById("prescription-patient-id") as HTMLInputElement).value)
    const medicationName = (document.getElementById("prescription-medication-name") as HTMLInputElement).value.trim()
    const dosage = (document.getElementById("prescription-dosage") as HTMLInputElement).value.trim()
    const frequency = (document.getElementById("prescription-frequency") as HTMLInputElement).value.trim()
    const durationDaysInput = (document.getElementById("prescription-duration-days") as HTMLInputElement).value
    const instructions = (document.getElementById("prescription-instructions") as HTMLTextAreaElement).value.trim()

    // Validation for required fields
    if (!appointmentId || !patientId || !medicationName) {
      uiStore.addToast("error", "Preencha todos os campos obrigatórios")
      return
    }

    // Disable submit button
    submitButton.textContent = "Criando..."
    submitButton.disabled = true

    try {
      const payload: CreatePrescriptionPayload = {
        appointment_id: appointmentId,
        patient_id: patientId,
        medication_name: medicationName,
      }

      // Add optional fields if provided
      if (dosage) payload.dosage = dosage
      if (frequency) payload.frequency = frequency
      if (durationDaysInput) payload.duration_days = Number(durationDaysInput)
      if (instructions) payload.instructions = instructions

      const response = await createPrescription(payload)

      if (response.success && response.data) {
        uiStore.addToast("success", `Prescrição de "${medicationName}" criada com sucesso!`)
        closeModal()
      } else if (response.error) {
        const errorMessage = getPrescriptionErrorMessage(response.error.code)
        uiStore.addToast("error", errorMessage || response.error.message || "Erro ao criar prescrição")
      }
    } catch (error) {
      console.error("Error creating prescription:", error)
      uiStore.addToast("error", "Erro inesperado ao criar prescrição")
    } finally {
      submitButton.textContent = "Criar Prescrição"
      submitButton.disabled = false
    }
  })
}

function getPrescriptionErrorMessage(errorCode?: string): string | undefined {
  const errorMessages: Record<string, string> = {
    PRESCRIPTION_NOT_FOUND: "Prescrição não encontrada",
    FORBIDDEN: "Você não tem permissão para criar prescrições",
    INVALID_APPOINTMENT_ID: "ID de consulta inválido",
    APPOINTMENT_NOT_FOUND: "Consulta não encontrada",
    PATIENT_NOT_FOUND: "Paciente não encontrado",
    UNAUTHORIZED: "Você precisa estar autenticado",
    INVALID_MEDICATION: "Medicamento inválido",
  }

  return errorCode ? errorMessages[errorCode] : undefined
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDoctorDashboard)
} else {
  initDoctorDashboard()
}
