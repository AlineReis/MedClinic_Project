import { listProfessionals } from "../services/professionalsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UserSession } from "../types/auth"
import type { ProfessionalSummary } from "../types/professionals"

const doctorsGrid = document.getElementById("doctors-grid")
const toastContainer = document.getElementById("toast-container")

document.addEventListener("DOMContentLoaded", () => {
  hydrateSessionUser()
  loadProfessionals()
})

async function loadProfessionals() {
  if (!doctorsGrid) return

  const session = getSessionFromStorage() ?? authStore.getSession()
  if (!session) {
    redirectToLogin()
    return
  }

  const response = await listProfessionals()
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

  renderProfessionals(response.data.data)
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
}

function buildProfessionalCard(professional: ProfessionalSummary) {
  const price = professional.consultation_price
    ? formatCurrency(professional.consultation_price)
    : "A confirmar"
  const registration = professional.registration_number
    ? `CRM ${professional.registration_number}`
    : "Registro disponível"

  return `
    <div class="group flex flex-col bg-surface-dark border border-border-dark rounded-xl overflow-hidden hover:border-primary/50 transition-all shadow-sm hover:shadow-md hover:shadow-primary/5">
      <div class="p-5 flex gap-4 items-start">
        <div class="size-20 rounded-full bg-primary/10 border border-border-dark flex items-center justify-center text-primary text-lg font-bold">
          ${getInitials(professional.name)}
        </div>
        <div class="flex flex-col flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-white text-lg font-bold leading-tight truncate">${professional.name}</h3>
              <p class="text-primary text-sm font-medium mt-1">${professional.specialty}</p>
            </div>
          </div>
          <p class="text-text-secondary text-xs mt-1">${registration}</p>
        </div>
      </div>
      <div class="h-px bg-border-dark mx-5"></div>
      <div class="p-5 flex items-center justify-between">
        <div>
          <span class="text-xs text-text-secondary uppercase">A partir de</span>
          <p class="text-base font-bold text-white">${price}</p>
        </div>
        <button class="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">
          Ver Horários
        </button>
      </div>
    </div>
  `
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
    toastElement.className =
      "rounded-lg px-4 py-2 text-sm shadow-lg border border-border-dark bg-surface-dark"
    toastElement.textContent = toast.text
    toastContainer.appendChild(toastElement)
  })
}
