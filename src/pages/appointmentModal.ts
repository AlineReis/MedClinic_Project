import { getAppointment, rescheduleAppointment } from "../services/appointmentsService"
import { getProfessionalAvailability } from "../services/professionalsService"
import type { AppointmentSummary } from "../types/appointments"
import { uiStore } from "../stores/uiStore"
import { dashboardStore } from "../stores/dashboardStore"

type ModalMode = 'details' | 'reschedule'

export async function openAppointmentModal(appointmentId: number, mode: ModalMode = 'details') {
  try {
    const response = await getAppointment(appointmentId)
    
    if (!response.success || !response.data) {
      uiStore.addToast('error', 'Não foi possível carregar os detalhes da consulta')
      return
    }

    showAppointmentModal(response.data, mode)
  } catch (error) {
    console.error('Error loading appointment:', error)
    uiStore.addToast('error', 'Erro ao carregar consulta')
  }
}

function showAppointmentModal(appointment: AppointmentSummary, mode: ModalMode) {
  const title = mode === 'details' ? 'Detalhes da Consulta' : 'Remarcar Consulta'
  const icon = mode === 'details' ? 'event_note' : 'edit_calendar'
  
  const modalHTML = `
    <div class="modal modal--open" style="z-index: 9999;">
      <div class="modal__dialog">
        <div class="modal__header">
          <div class="modal__title-group">
            <div class="modal__icon">
              <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div>
              <h2 class="modal__title">${title}</h2>
              <p class="modal__subtitle">Consulta #${appointment.id}</p>
            </div>
          </div>
          <button class="modal__close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal__body">
          <div class="modal__professional-summary">
            <div class="modal__professional-avatar">
                ${getInitials(appointment.professional_name)}
            </div>
            <div class="modal__professional-info">
                <h3 class="modal__professional-name">${appointment.professional_name}</h3>
                <p class="modal__professional-specialty">${appointment.specialty}</p>
            </div>
          </div>
          ${mode === 'details' ? renderDetailsContent(appointment) : renderRescheduleForm(appointment)}
        </div>
        ${mode === 'reschedule' ? `
          <div class="modal__footer">
            <button class="btn btn--outline btn-cancel">Cancelar</button>
            <button id="confirm-reschedule" class="btn btn--primary" disabled>
              <span class="material-symbols-outlined">save</span>
              Confirmar
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `

  const container = document.createElement('div')
  container.innerHTML = modalHTML
  const modalElement = container.firstElementChild as HTMLElement
  document.body.appendChild(modalElement)

  // Simple close function
  const closeModal = () => modalElement.remove()

  // Close on X button click
  modalElement.querySelector('.modal__close')?.addEventListener('click', closeModal)

  // Close on cancel button (if exists)
  modalElement.querySelector('.btn-cancel')?.addEventListener('click', closeModal)

  // Close on overlay click (not on modal content)
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) closeModal()
  })

  // Setup reschedule logic if needed
  if (mode === 'reschedule') {
    setupRescheduleLogic(appointment, closeModal)
  }
}

function renderDetailsContent(appointment: AppointmentSummary) {
  return `
    <div class="info-grid">
      <div class="info-card">
        <span class="info-card__label">Data</span>
        <div class="info-card__value">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>${formatDateFull(appointment.date)}</span>
        </div>
      </div>
      <div class="info-card">
        <span class="info-card__label">Horário</span>
        <div class="info-card__value">
          <span class="material-symbols-outlined">schedule</span>
          <span>${appointment.time}</span>
        </div>
      </div>
      <div class="info-card info-card--full">
        <div class="info-card__value-group">
          <div>
            <span class="info-card__label">Situação</span>
            <div class="info-card__status">${formatStatus(appointment.status)}</div>
          </div>
          <span class="status-pill ${getStatusPillClass(appointment.status)}">
            ${appointment.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  `
}

function renderRescheduleForm(appointment: AppointmentSummary) {
  return `
    <div class="alert alert--warning">
      <span class="material-symbols-outlined">info</span>
      <p>Você está reagendando a consulta de <strong>${formatDateShort(appointment.date)} às ${appointment.time}</strong>.</p>
    </div>
    <div class="form-group">
      <label for="new-date" class="form-label">Nova Data</label>
      <input type="date" id="new-date" class="form-input" min="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="form-group">
      <label class="form-label">Horários Disponíveis</label>
      <div id="slots-container" class="slots-grid">
        <p class="slots-grid__empty">Selecione uma data para ver os horários.</p>
      </div>
    </div>
  `
}

async function setupRescheduleLogic(appointment: AppointmentSummary, closeModal: () => void) {
  const dateInput = document.getElementById('new-date') as HTMLInputElement
  const slotsContainer = document.getElementById('slots-container') as HTMLElement
  const confirmBtn = document.getElementById('confirm-reschedule') as HTMLButtonElement

  if (!dateInput || !slotsContainer || !confirmBtn) return

  let selectedTime: string | null = null

  dateInput.addEventListener('change', async (e) => {
    const selectedDate = (e.target as HTMLInputElement).value
    if (!selectedDate) return

    selectedTime = null
    confirmBtn.disabled = true
    slotsContainer.innerHTML = `
      <div style="grid-column: span 3; text-align: center; padding: 1.5rem; color: var(--text-secondary);">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
        Buscando horários...
      </div>
    `

    try {
      const response = await getProfessionalAvailability(
        appointment.professional_id,
        { startDate: selectedDate, endDate: selectedDate, daysAhead: 1 }
      )

      if (response.success && response.data && Array.isArray(response.data)) {
        const slots = response.data.filter(s => s.date === selectedDate && s.is_available)
        renderSlots(slots, slotsContainer, confirmBtn, (time) => { selectedTime = time })
      } else {
        slotsContainer.innerHTML = `<p class="slots-grid__empty" style="color: #ef4444;">Erro ao buscar horários.</p>`
      }
    } catch (err) {
      console.error(err)
      slotsContainer.innerHTML = `<p class="slots-grid__empty" style="color: #ef4444;">Erro de conexão.</p>`
    }
  })

  confirmBtn.addEventListener('click', async () => {
    if (!dateInput.value || !selectedTime) {
      uiStore.addToast('error', 'Selecione data e hora.')
      return
    }

    confirmBtn.disabled = true
    confirmBtn.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> Processando...'

    try {
      const result = await rescheduleAppointment(appointment.id, {
        newDate: dateInput.value,
        newTime: selectedTime
      })

      if (result.success) {
        uiStore.addToast('success', 'Consulta reagendada!')
        closeModal()
        dashboardStore.loadData()
      } else {
        uiStore.addToast('error', result.error?.message || 'Erro ao reagendar')
        confirmBtn.disabled = false
        confirmBtn.innerHTML = '<span class="material-symbols-outlined">save</span> Confirmar'
      }
    } catch (err) {
      uiStore.addToast('error', 'Erro de conexão')
      console.error(err)
      confirmBtn.disabled = false
      confirmBtn.innerHTML = '<span class="material-symbols-outlined">save</span> Confirmar'
    }
  })
}

function renderSlots(slots: any[], container: HTMLElement, confirmBtn: HTMLButtonElement, onSelect: (time: string) => void) {
  if (slots.length === 0) {
    container.innerHTML = `<p class="slots-grid__empty">Nenhum horário disponível.</p>`
    return
  }

  container.innerHTML = slots.map(slot => `
    <button class="slot-btn" data-time="${slot.time}">${slot.time.substring(0, 5)}</button>
  `).join('')

  container.querySelectorAll('.slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('slot-btn--active'))
      btn.classList.add('slot-btn--active')
      const time = btn.getAttribute('data-time')
      if (time) {
        onSelect(time)
        confirmBtn.disabled = false
      }
    })
  })
}

// Helpers
function getInitials(name: string) {
  return name?.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "U"
}

function formatDateFull(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string) {
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

function getStatusPillClass(status: string) {
  if (['scheduled', 'confirmed'].includes(status)) return 'status-pill--confirmed'
  if (status === 'completed') return 'status-pill--completed'
  return 'status-pill--cancelled'
}
