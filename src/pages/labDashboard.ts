import "../../css/global.css"
import { Navigation } from "../components/Navigation"
import { ToastContainer } from "../components/ToastContainer"
import { listExams } from "../services/examsService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { ExamSummary } from "../types/exams"

const queueBody = document.querySelector("[data-lab-queue-body]")
const countElements: Record<string, HTMLElement | null> = {
  pending: document.querySelector("[data-lab-count='pending']"),
  analysis: document.querySelector("[data-lab-count='analysis']"),
  ready: document.querySelector("[data-lab-count='ready']"),
  urgent: document.querySelector("[data-lab-count='urgent']"),
}

let navigation: Navigation | null = null
let toastContainer: ToastContainer | null = null
		console.log(1)

document.addEventListener("DOMContentLoaded", () => {
  toastContainer = new ToastContainer()
  navigation = new Navigation()
  initLabDashboard()
})

async function initLabDashboard() {
  const session = await authStore.refreshSession()
  if (!session || session.role !== "lab_tech") {
    uiStore.addToast("warning", "Acesso restrito ao laboratório")
    window.location.href = "/pages/login.html"
    return
  }

  await loadQueue()
}

async function loadQueue() {
  renderQueueLoading()

  try {
    const response = await listExams()
    if (!response.success || !response.data) {
      throw new Error(response.error?.message ?? "Não foi possível carregar os exames")
    }

    const exams = response.data
    updateCounts(exams)
    renderQueueRows(exams)
  } catch (error) {
    console.error("Erro ao carregar exames:", error)
    uiStore.addToast("error", "Não foi possível carregar a fila de exames.")
    renderQueueError()
  }
}

function updateCounts(exams: ExamSummary[]) {
  const summary = exams.reduce(
    (acc, exam) => {
      const status = exam.status ?? ""
      if (status === "pending" || status === "PENDENTE") {
        acc.pending += 1
      }
      if (status === "in_analysis" || status === "IN_ANALYSIS") {
        acc.analysis += 1
      }
      if (status === "ready" || status === "ready_to_review" || status === "READY") {
        acc.ready += 1
      }
      if (exam.isUrgent || exam.priority === "urgent" || status === "urgent") {
        acc.urgent += 1
      }
      return acc
    },
    { pending: 0, analysis: 0, ready: 0, urgent: 0 },
  )

  Object.entries(summary).forEach(([key, value]) => {
  	const el = countElements[key];
	if (el) {
		el.textContent = String(value);
	}
  });
}

function renderQueueRows(exams: ExamSummary[]) {
  if (!queueBody) return

  if (exams.length === 0) {
    queueBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-slate-400">
          Nenhum exame cadastrado no momento
        </td>
      </tr>
    `
    return
  }

  queueBody.innerHTML = exams
    .map(exam => {
      return buildExamRow(exam)
    })
    .join("")

  queueBody.querySelectorAll("[data-exam-action]").forEach(button => {
    button.addEventListener("click", handleExamAction)
  })
}

function renderQueueLoading() {
  if (!queueBody) return
  queueBody.innerHTML = `
    <tr>
      <td colspan="5" class="px-6 py-8 text-center text-slate-500">
        Carregando exames...
      </td>
    </tr>
  `
}

function renderQueueError() {
  if (!queueBody) return
  queueBody.innerHTML = `
    <tr>
      <td colspan="5" class="px-6 py-8 text-center text-red-400">
        Erro ao carregar a fila. Tente novamente mais tarde.
      </td>
    </tr>
  `
}

function buildExamRow(exam: ExamSummary) {
  const patient = exam.patientName ?? "Paciente"
  const requester = exam.requestingProfessionalName ?? "Solicitante"
  const badge = getStatusBadge(exam.status)
  const action = getActionForStatus(exam.status)

  return `
    <tr class="hover:bg-border-dark/10" data-exam-row="${exam.id}">
      <td class="px-6 py-4 font-medium">${patient}</td>
      <td class="px-6 py-4">${exam.exam_name}</td>
      <td class="px-6 py-4 text-slate-400">${requester}</td>
      <td class="px-6 py-4">${badge}</td>
      <td class="px-6 py-4">
        <button
          class="px-3 py-1.5 ${action.className} text-white text-[10px] font-bold rounded"
          data-exam-action="${exam.id}"
          data-action-type="${action.type}"
        >
          ${action.label}
        </button>
      </td>
    </tr>
  `
}

function getStatusBadge(status: string | undefined) {
  const normalized = (status ?? "").toLowerCase()
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "PENDENTE", color: "amber" },
    in_analysis: { label: "EM ANÁLISE", color: "blue" },
    ready: { label: "PRONTO", color: "emerald" },
    urgent: { label: "URGENTE", color: "red" },
  }

  const badge = map[normalized] || { label: normalized.toUpperCase() || "PENDENTE", color: "slate" }

  return `<span class="px-2 py-0.5 rounded bg-${badge.color}-500/10 text-${badge.color}-500 text-[10px] font-bold">${badge.label}</span>`
}

function getActionForStatus(status: string | undefined) {
  const normalized = (status ?? "").toLowerCase()
  if (normalized === "pending") {
    return { label: "INICIAR", type: "start", className: "bg-primary" }
  }
  if (normalized === "in_analysis") {
    return { label: "LIBERAR", type: "release", className: "bg-emerald-600" }
  }
  return { label: "DETALHES", type: "details", className: "bg-border-dark text-slate-200" }
}

function handleExamAction(event: Event) {
  const target = event.currentTarget as HTMLElement
  const examIdAttr = target.getAttribute("data-exam-action")
  const actionType = target.getAttribute("data-action-type")

  if (!examIdAttr) return
  const examId = Number(examIdAttr)

  uiStore.addToast(
    "info",
    `Ação '${actionType}' disparada para o exame ${examId}. Implementar hook real quando o backend disponibilizar essa operação.`,
  )
}
