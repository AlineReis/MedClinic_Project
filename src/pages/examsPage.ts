import { listExams } from "../services/examsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UserSession } from "../types/auth"
import type { ExamSummary } from "../types/exams"

const toastContainer = document.getElementById("toast-container")

document.addEventListener("DOMContentLoaded", () => {
  hydrateSessionUser()
  loadPatientExams()
})

async function loadPatientExams() {
  const session = await resolveSession()
  if (!session) {
    redirectToLogin()
    return
  }

  if (session.role !== "patient") {
    return
  }

  const response = await listExams({ patientId: session.id })
  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar seus exames.",
    )
    renderToasts()
    return
  }

  renderPatientExams(response.data)
}

async function resolveSession() {
  return (getSessionFromStorage() ?? authStore.getSession()) ??
    (await authStore.refreshSession())
}

function renderPatientExams(exams: ExamSummary[]) {
  const tableBody = document.querySelector("tbody.divide-border-dark")
  if (!tableBody) return

  if (exams.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-slate-400">
          Nenhum exame encontrado para este paciente.
        </td>
      </tr>
    `
    return
  }

  tableBody.innerHTML = exams.map(exam => buildExamRow(exam)).join("")
}

function buildExamRow(exam: ExamSummary) {
  return `
    <tr class="hover:bg-border-dark/10 transition-colors">
      <td class="px-6 py-4">
        <p class="text-sm font-bold">Paciente</p>
        <p class="text-xs text-slate-500">ID: ${exam.id}</p>
      </td>
      <td class="px-6 py-4">
        <p class="text-sm">${exam.exam_name}</p>
      </td>
      <td class="px-6 py-4">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(exam.status)}">
          ${formatStatus(exam.status)}
        </span>
      </td>
      <td class="px-6 py-4 text-center">
        <span class="material-symbols-outlined text-slate-600">priority_high</span>
      </td>
      <td class="px-6 py-4">
        <button class="text-primary hover:text-white flex items-center gap-1 text-xs font-bold underline">
          VER DETALHES
        </button>
      </td>
    </tr>
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

function getSessionFromStorage(): UserSession | null {
  try {
    const stored = sessionStorage.getItem("medclinic-session")
    return stored ? (JSON.parse(stored) as UserSession) : null
  } catch (error) {
    console.warn("Não foi possível ler a sessão armazenada.", error)
    return null
  }
}

function redirectToLogin() {
  window.location.href = getBasePath() + "login.html"
}

function getBasePath() {
  return window.location.pathname.includes("/pages/") ? "" : "pages/"
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Pendente",
    released: "Liberado",
    in_progress: "Em análise",
  }

  return map[status] ?? status
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    released: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  }

  return map[status] ?? "bg-slate-800 text-slate-400 border border-slate-700"
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
