import { getAppointment, rescheduleAppointment } from "../services/appointmentsService"
import { getProfessionalAvailability } from "../services/professionalsService"
import type { AppointmentSummary } from "../types/appointments"
import { uiStore } from "../stores/uiStore"
import { dashboardStore } from "../stores/dashboardStore"

// Appointment Modal Functions

type ModalMode = 'details' | 'reschedule'

export async function openAppointmentModal(appointmentId: number, mode: ModalMode = 'details') {
  try {
    const response = await getAppointment(appointmentId)
    
    if (!response.success || !response.data) {
      uiStore.addToast('error', 'Não foi possível carregar os detalhes da consulta')
      return
    }

    const appointment = response.data
    showAppointmentModal(appointment, mode)
  } catch (error) {
    console.error('Error loading appointment:', error)
    uiStore.addToast('error', 'Erro ao carregar consulta')
  }
}

function showAppointmentModal(appointment: AppointmentSummary, mode: ModalMode) {
  // Determine content based on mode
  const title = mode === 'details' ? 'Detalhes da Consulta' : 'Remarcar Consulta'
  
  const modalHTML = `
    <div id="appointment-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-surface-dark border border-border-dark rounded-2xl max-w-lg w-full shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="sticky top-0 bg-surface-dark border-b border-border-dark px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0 z-10">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-[20px]">${mode === 'details' ? 'event_note' : 'edit_calendar'}</span>
            </div>
            <div>
              <h2 class="text-lg font-bold">${title}</h2>
              <p class="text-xs text-slate-400">Consulta #${appointment.id}</p>
            </div>
          </div>
          <button id="close-appointment-modal" class="size-8 rounded-lg hover:bg-border-dark flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <!-- Content (Scrollable) -->
        <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <!-- Professional Details -->
          <div class="flex items-start gap-4 p-4 bg-background-dark/50 rounded-xl border border-border-dark">
            <div class="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20 shrink-0">
              ${getInitials(appointment.professional_name)}
            </div>
            <div>
              <h3 class="font-bold text-lg text-white">${appointment.professional_name}</h3>
              <p class="text-blue-400 text-sm font-medium mb-1">${appointment.specialty}</p>
              <div class="flex items-center gap-2 text-xs text-slate-400">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span> Sala ${appointment.room || 'N/A'}</span>
              </div>
            </div>
          </div>

          ${mode === 'details' ? renderDetailsContent(appointment) : renderRescheduleForm(appointment)}
          
        </div>

        ${mode === 'reschedule' ? `
          <!-- Footer Actions -->
          <div class="p-6 pt-0 flex gap-3 shrink-0">
            <button id="cancel-reschedule" class="flex-1 px-4 py-2.5 bg-transparent border border-border-dark hover:bg-background-dark text-slate-300 rounded-xl font-medium transition-all">
              Cancelar
            </button>
            <button id="confirm-reschedule" disabled class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-symbols-outlined text-sm">save</span>
              Confirmar
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `

  // Append to body
  const modalContainer = document.createElement('div')
  modalContainer.innerHTML = modalHTML
  document.body.appendChild(modalContainer)

  // Handlers
  const closeModal = () => modalContainer.remove()
  
  document.getElementById('close-appointment-modal')?.addEventListener('click', closeModal)
  document.getElementById('appointment-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('appointment-modal')) closeModal()
  })

  // Specific Logic for Reschedule Mode
  if (mode === 'reschedule') {
    setupRescheduleLogic(appointment, closeModal)
  }
}

function renderDetailsContent(appointment: AppointmentSummary) {
  return `
    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-background-dark rounded-xl border border-border-dark flex flex-col gap-1">
        <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Data</span>
        <div class="flex items-center gap-2 text-white font-medium">
          <span class="material-symbols-outlined text-primary">calendar_today</span>
          ${formatDateFull(appointment.date)}
        </div>
      </div>
      <div class="p-4 bg-background-dark rounded-xl border border-border-dark flex flex-col gap-1">
        <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Horário</span>
        <div class="flex items-center gap-2 text-white font-medium">
          <span class="material-symbols-outlined text-primary">schedule</span>
          ${appointment.time}
        </div>
      </div>
      <div class="col-span-2 p-4 bg-background-dark rounded-xl border border-border-dark flex items-center justify-between">
         <div class="flex flex-col gap-1">
            <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Situação</span>
            <span class="font-medium text-white">${formatStatus(appointment.status)}</span>
         </div>
         <span class="px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(appointment.status)}">
           ${appointment.status.toUpperCase()}
         </span>
      </div>
    </div>
  `
}

function renderRescheduleForm(appointment: AppointmentSummary) {
    return `
      <div class="space-y-4">
        <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm flex gap-3">
           <span class="material-symbols-outlined shrink-0">info</span>
           <p>Você está reagendando a consulta atual de <strong>${formatDateShort(appointment.date)} às ${appointment.time}</strong>.</p>
        </div>

        <div class="space-y-4">
            <div class="space-y-2">
                <label for="new-date" class="text-sm font-medium text-slate-300">Nova Data</label>
                <input type="date" id="new-date" class="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" min="${new Date().toISOString().split('T')[0]}" />
            </div>
            
            <div class="space-y-2">
                <label class="text-sm font-medium text-slate-300">Horários Disponíveis</label>
                <div id="slots-container" class="grid grid-cols-3 gap-2 min-h-[60px]">
                    <p class="col-span-3 text-sm text-slate-500 text-center py-4 bg-background-dark rounded-xl border border-border-dark border-dashed">
                        Selecione uma data para ver os horários.
                    </p>
                </div>
            </div>
        </div>
      </div>
    `
}

async function setupRescheduleLogic(appointment: AppointmentSummary, closeModal: () => void) {
    const dateInput = document.getElementById('new-date') as HTMLInputElement
    const slotsContainer = document.getElementById('slots-container') as HTMLElement
    const confirmBtn = document.getElementById('confirm-reschedule') as HTMLButtonElement
    const cancelBtn = document.getElementById('cancel-reschedule') as HTMLButtonElement

    let selectedTime: string | null = null

    cancelBtn.addEventListener('click', closeModal)

    // Date Change Handler
    dateInput.addEventListener('change', async (e) => {
        const selectedDate = (e.target as HTMLInputElement).value
        if (!selectedDate) return

        // Reset Selection
        selectedTime = null
        confirmBtn.disabled = true
        slotsContainer.innerHTML = `
            <div class="col-span-3 flex items-center justify-center py-6 text-slate-400 gap-2">
                <span class="material-symbols-outlined text-sm animate-spin">sync</span>
                <span class="text-sm">Buscando horários...</span>
            </div>
        `

        try {
            // Fetch availability for 1 day (the selected day)
            const response = await getProfessionalAvailability(
                appointment.professional_id, 
                { startDate: selectedDate, endDate: selectedDate, daysAhead: 1 }
            )

            if (response.success && response.data && Array.isArray(response.data)) {
                // Filter slots for the selected date
                const slots = response.data.filter(s => s.date === selectedDate && s.is_available)
                renderSlots(slots)
            } else {
                slotsContainer.innerHTML = `<p class="col-span-3 text-sm text-red-400 text-center py-4">Erro ao buscar horários.</p>`
            }
        } catch (err) {
            console.error(err)
            slotsContainer.innerHTML = `<p class="col-span-3 text-sm text-red-400 text-center py-4">Erro de conexão.</p>`
        }
    })

    // Render Slots Helper
    const renderSlots = (slots: any[]) => {
        if (slots.length === 0) {
            slotsContainer.innerHTML = `
                <div class="col-span-3 py-6 text-center bg-background-dark rounded-xl border border-border-dark border-dashed">
                    <p class="text-sm text-slate-400">Nenhum horário disponível.</p>
                </div>
            `
            return
        }

        slotsContainer.innerHTML = slots.map(slot => `
            <button 
                data-time="${slot.time}"
                class="slot-btn px-2 py-2.5 rounded-lg border border-border-dark bg-background-dark hover:border-primary/50 hover:bg-primary/5 text-sm font-medium transition-all text-slate-300 hover:text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-bg-surface-dark"
            >
                ${slot.time.substring(0, 5)}
            </button>
        `).join('')

        // Attach Slot Click Handlers
        slotsContainer.querySelectorAll('.slot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Clear active state
                slotsContainer.querySelectorAll('.slot-btn').forEach(b => {
                    b.classList.remove('bg-primary', 'text-white', 'border-primary', 'ring-2', 'ring-primary')
                    b.classList.add('bg-background-dark', 'text-slate-300', 'border-border-dark')
                })

                // Set active state
                const target = e.target as HTMLElement
                target.classList.remove('bg-background-dark', 'text-slate-300', 'border-border-dark')
                target.classList.add('bg-primary', 'text-white', 'border-primary', 'ring-2', 'ring-primary')

                selectedTime = target.getAttribute('data-time')
                confirmBtn.disabled = false
            })
        })
    }

    // Confirm Reschedule Handler
    confirmBtn.addEventListener('click', async () => {
        if (!dateInput.value || !selectedTime) {
            uiStore.addToast('error', 'Por favor, selecione data e hora.')
            return
        }

        // Loading state
        confirmBtn.disabled = true
        confirmBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> Processando...`

        try {
            const result = await rescheduleAppointment(appointment.id, {
                newDate: dateInput.value,
                newTime: selectedTime
            })

            if (result.success) {
                uiStore.addToast('success', 'Consulta reagendada com sucesso!')
                closeModal()
                // Trigger dashboard update manually
                dashboardStore.loadData() 
            } else {
                uiStore.addToast('error', result.error?.message || 'Erro ao reagendar consulta')
            }
        } catch (err) {
            uiStore.addToast('error', 'Erro ao processar solicitação')
            console.error(err)
        } finally {
            confirmBtn.disabled = false
            confirmBtn.innerHTML = `<span class="material-symbols-outlined text-sm">save</span> Confirmar`
        }
    })
}

// Helpers
function getInitials(name: string) {
  if (!name) return "U"
  return name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

function formatDateFull(dateStr: string) {
    // Append T12:00:00 to avoid timezone shifts
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string) {
    // Append T12:00:00 to avoid timezone shifts
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatStatus(status: string) {
    const map: Record<string, string> = {
      scheduled: 'Agendada',
      confirmed: 'Confirmada',
      completed: 'Realizada',
      cancelled: 'Cancelada'
    }
    return map[status] || status
}

function getStatusColor(status: string) {
    if (['scheduled', 'confirmed'].includes(status)) return 'bg-emerald-500/10 text-emerald-500'
    if (status === 'completed') return 'bg-blue-500/10 text-blue-500'
    return 'bg-red-500/10 text-red-500'
}
