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
    <div id="prescription-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-surface-dark border border-border-dark rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <!-- Header -->
        <div class="sticky top-0 bg-surface-dark border-b border-border-dark px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
            </div>
            <div>
              <h2 class="text-lg font-bold">Detalhes da Prescrição</h2>
              <p class="text-xs text-slate-400">Prescrição #${prescription.id}</p>
            </div>
          </div>
          <button id="close-prescription-modal" class="size-8 rounded-lg hover:bg-border-dark flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Professional Info -->
          ${prescription.professional ? `
            <div class="bg-background-dark border border-border-dark rounded-xl p-4">
              <div class="flex items-center gap-3">
                <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-[24px]">person</span>
                </div>
                <div>
                  <p class="text-sm font-semibold">${prescription.professional.name}</p>
                  <p class="text-xs text-slate-400">${prescription.professional.specialty}</p>
                  ${prescription.professional.registration_number ? `<p class="text-xs text-slate-500">CRM: ${prescription.professional.registration_number}</p>` : ''}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Medication Info -->
          <div>
            <h3 class="text-sm font-bold mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-500">medication</span>
              Medicamento Prescrito
            </h3>
            <div class="bg-background-dark border border-border-dark rounded-xl overflow-hidden">
              <div class="grid grid-cols-2 md:grid-cols-4">
                <div class="p-4 border-r border-b md:border-b-0 border-border-dark">
                  <p class="text-[10px] text-slate-500 uppercase mb-1">Nome do Medicamento</p>
                  <p class="font-semibold text-sm">${prescription.medication_name}</p>
                </div>
                <div class="p-4 border-b md:border-b-0 md:border-r border-border-dark">
                  <p class="text-[10px] text-slate-500 uppercase mb-1">Dosagem</p>
                  <p class="font-semibold text-sm">${prescription.dosage || 'Não especificado'}</p>
                </div>
                <div class="p-4 border-r md:border-r border-border-dark">
                  <p class="text-[10px] text-slate-500 uppercase mb-1">Frequência</p>
                  <p class="font-semibold text-sm">${prescription.frequency || 'Não especificado'}</p>
                </div>
                <div class="p-4 border-border-dark">
                  <p class="text-[10px] text-slate-500 uppercase mb-1">Duração</p>
                  <p class="font-semibold text-sm">${prescription.duration_days ? `${prescription.duration_days} dias` : 'Não especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Instructions -->
          ${prescription.instructions ? `
            <div>
              <h3 class="text-sm font-bold mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-400">info</span>
                Instruções de Uso
              </h3>
              <div class="bg-background-dark border border-border-dark rounded-xl p-4">
                <p class="text-sm text-slate-300 leading-relaxed">${prescription.instructions}</p>
              </div>
            </div>
          ` : ''}

          <!-- Metadata -->
          <div class="pt-4 border-t border-border-dark text-xs text-slate-500">
            <span>Emitida em: <strong class="text-slate-400">${formatDateLong(prescription.created_at)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  `

  // Append to body
  const modalContainer = document.createElement('div')
  modalContainer.innerHTML = modalHTML
  document.body.appendChild(modalContainer)

  // Add close handlers
  const closeBtn = document.getElementById('close-prescription-modal')
  const modalOverlay = document.getElementById('prescription-modal')
  
  const closeModal = () => {
    modalContainer.remove()
  }

  closeBtn?.addEventListener('click', closeModal)
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal()
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
