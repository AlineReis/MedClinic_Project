import { getPrescription } from "../services/prescriptionsService"
import type { PrescriptionDetail } from "../types/prescriptions"
import { uiStore } from "../stores/uiStore"

// Prescription Modal Functions

async function openPrescriptionModal(prescriptionId: number) {
  try {
    const response = await getPrescription(prescriptionId)
    
    if (!response.success || !response.data) {
      uiStore.addToast('error', 'Não foi possível carregar os detalhes da prescrição')
      return
    }

    // response.data is guaranteed to be PrescriptionDetail after successful mapping
    const prescription = response.data as PrescriptionDetail
    showPrescriptionModal(prescription)
  } catch (error) {
    console.error('Error loading prescription:', error)
    uiStore.addToast('error', 'Erro ao carregar prescrição')
  }
}

function showPrescriptionModal(prescription: PrescriptionDetail) {
  // Create modal overlay
  const modalHTML = `
    <div class="modal modal--open" style="z-index: 9999;">
      <div class="modal__dialog">
        <div class="modal__header">
          <div class="modal__title-group">
            <div class="modal__icon">
              <span class="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <h2 class="modal__title">Detalhes da Prescrição</h2>
              <p class="modal__subtitle">Prescrição #${prescription.id}</p>
            </div>
          </div>
          <button class="modal__close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="modal__body">
          <div class="prescription-detail">
            <!-- Professional Info -->
            ${prescription.professional ? `
              <div class="professional-summary">
                <div class="professional-summary__container">
                  <div class="professional-summary__avatar">
                    <span class="material-symbols-outlined">person</span>
                  </div>
                  <div class="professional-summary__info">
                    <p class="professional-summary__name">${prescription.professional.name}</p>
                    <p class="professional-summary__specialty">${prescription.professional.specialty}</p>
                    ${prescription.professional.registration_number ? `<p class="professional-summary__crm">CRM: ${prescription.professional.registration_number}</p>` : ''}
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Medication Info -->
            <div>
              <h3 class="prescription-detail__section-title prescription-detail__section-title--medication">
                <span class="material-symbols-outlined">medication</span>
                Medicamento Prescrito
              </h3>
              <div class="prescription-detail__grid-wrapper">
                <div class="prescription-detail__grid">
                  <div class="prescription-detail__item">
                    <p class="prescription-detail__label">Nome do Medicamento</p>
                    <p class="prescription-detail__value">${prescription.medication_name}</p>
                  </div>
                  <div class="prescription-detail__item">
                    <p class="prescription-detail__label">Dosagem</p>
                    <p class="prescription-detail__value">${prescription.dosage || 'Não especificado'}</p>
                  </div>
                  <div class="prescription-detail__item">
                    <p class="prescription-detail__label">Frequência</p>
                    <p class="prescription-detail__value">${prescription.frequency || 'Não especificado'}</p>
                  </div>
                  <div class="prescription-detail__item">
                    <p class="prescription-detail__label">Duração</p>
                    <p class="prescription-detail__value">${prescription.duration_days ? `${prescription.duration_days} dias` : 'Não especificado'}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            ${prescription.instructions ? `
              <div>
                <h3 class="prescription-detail__section-title prescription-detail__section-title--instructions">
                  <span class="material-symbols-outlined">info</span>
                  Instruções de Uso
                </h3>
                <div class="prescription-detail__instructions">
                  <p class="prescription-detail__text">${prescription.instructions}</p>
                </div>
              </div>
            ` : ''}

            <!-- Metadata -->
            <div class="prescription-detail__footer">
              <span>Emitida em: <strong class="prescription-detail__date">${formatDateLong(prescription.created_at)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Append to body
  const modalContainer = document.createElement('div')
  modalContainer.innerHTML = modalHTML
  const modalElement = modalContainer.firstElementChild as HTMLElement
  document.body.appendChild(modalElement)

  // Close handlers
  const closeModal = () => modalElement.remove()

  modalElement.querySelector('.modal__close')?.addEventListener('click', closeModal)
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) closeModal()
  })

  // ESC key to close
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

function formatDateLong(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  } catch {
    return dateString
  }
}

export { openPrescriptionModal }
