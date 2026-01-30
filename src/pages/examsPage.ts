import {
  uploadExamResult,
  releaseExamResult,
  listExams,
} from "../services/examsService";
import { authStore } from "../stores/authStore";
import { logout } from "../services/authService";
import { uiStore } from "../stores/uiStore";
import type { UserSession } from "../types/auth";
import type { ExamSummary } from "../types/exams";

const toastContainer = document.getElementById("toast-container");
let currentView: "all" | "history" = "all";

document.addEventListener("DOMContentLoaded", () => {
  hydrateSessionUser();
  loadExams();
  setupEventListeners();
});

function setupEventListeners() {
  // Logout button
  document
    .querySelector("[data-logout-button]")
    ?.addEventListener("click", async () => {
      await logout();
      window.location.href = getBasePath() + "login.html";
    });

  // History toggle
  document.getElementById("toggle-history")?.addEventListener("click", () => {
    currentView = currentView === "all" ? "history" : "all";
    loadExams();
  });
}

async function loadExams() {
  const session = await resolveSession();
  if (!session) {
    redirectToLogin();
    return;
  }

  const filters: any = {};

  // Se for paciente, filtrar por ID
  if (session.role === "patient") {
    filters.patientId = session.id;
  }

  const response = await listExams(filters);
  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar os exames.",
    );
    renderToasts();
    return;
  }

  // Filtrar por histórico se necessário
  let exams = response.data;
  if (currentView === "history") {
    exams = exams.filter(
      (e) => e.status === "delivered" || e.status === "ready",
    );
  }

  renderExams(exams, session);
}

async function resolveSession() {
  return (
    getSessionFromStorage() ??
    authStore.getSession() ??
    (await authStore.refreshSession())
  );
}

function renderExams(exams: ExamSummary[], session: UserSession) {
  const tableBody = document.querySelector("tbody.divide-y");
  if (!tableBody) return;

  if (exams.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-slate-400">
          Nenhum exame encontrado.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = exams
    .map((exam) => buildExamRow(exam, session))
    .join("");

  // Attach event listeners para botões
  attachActionButtons(session);
}

function buildExamRow(exam: ExamSummary, session: UserSession) {
  // Nome do paciente: da sessão se for patient, senão do exam
  const patientName =
    session.role === "patient" ? session.name : (exam.patient_name ?? "N/A");

  return `
    <tr class="hover:bg-border-dark/10 transition-colors">
      <td class="px-6 py-4">
        <p class="text-sm font-bold">${patientName}</p>
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
        ${getUrgencyIcon(exam.urgency)}
      </td>
      <td class="px-6 py-4">
        ${getActionButton(exam, session.role)}
      </td>
    </tr>
  `;
}

function getUrgencyIcon(urgency?: string) {
  if (urgency === "urgent" || urgency === "critical") {
    return '<span class="material-symbols-outlined text-danger animate-pulse">priority_high</span>';
  }
  return '<span class="material-symbols-outlined text-slate-600">priority_high</span>';
}

function getActionButton(exam: ExamSummary, role: string) {
  if (role === "patient") {
    return `<button class="text-primary hover:text-white flex items-center gap-1 text-xs font-bold underline">VER DETALHES</button>`;
  }

  // lab_tech
  if (
    exam.status === "pending_payment" ||
    exam.status === "paid" ||
    exam.status === "scheduled"
  ) {
    return `<button data-upload="${exam.id}" class="text-primary hover:text-white flex items-center gap-1 text-xs font-bold underline">UPLOAD LAUDO</button>`;
  }

  if (exam.status === "ready") {
    return `<button data-release="${exam.id}" class="bg-primary text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-blue-600">LIBERAR</button>`;
  }

  if (exam.status === "delivered") {
    return `<button class="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 text-xs font-bold underline">VER LAUDO</button>`;
  }

  return "—";
}

function attachActionButtons(session: UserSession) {
  if (session.role !== "lab_tech" && session.role !== "clinic_admin") return;

  // Upload buttons
  document.querySelectorAll("[data-upload]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const examId = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-upload")!,
      );
      await handleUpload(examId);
    });
  });

  // Release buttons
  document.querySelectorAll("[data-release]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const examId = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-release")!,
      );
      await handleRelease(examId);
    });
  });
}

async function handleUpload(examId: number) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/pdf";
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    uiStore.addToast("info", "Enviando laudo...");
    renderToasts();

    const response = await uploadExamResult(examId, file);
    if (response.success) {
      uiStore.addToast("success", "Laudo enviado com sucesso!");
      renderToasts();
      loadExams(); // Recarregar
    } else {
      uiStore.addToast("error", response.error?.message ?? "Erro ao enviar");
      renderToasts();
    }
  };
  input.click();
}

async function handleRelease(examId: number) {
  uiStore.addToast("info", "Liberando resultado...");
  renderToasts();

  const response = await releaseExamResult(examId);
  if (response.success) {
    uiStore.addToast("success", "Resultado liberado!");
    renderToasts();
    loadExams();
  } else {
    uiStore.addToast("error", response.error?.message ?? "Erro ao liberar");
    renderToasts();
  }
}

function hydrateSessionUser() {
  const session = getSessionFromStorage() ?? authStore.getSession();
  if (!session) return;

  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = session.name;
  });

  document.querySelectorAll("[data-user-initials]").forEach((element) => {
    element.textContent = getInitials(session.name);
  });

  document.querySelectorAll("[data-user-role]").forEach((element) => {
    element.textContent =
      session.role === "lab_tech" ? "Laboratório" : "Paciente";
  });
}

function getSessionFromStorage(): UserSession | null {
  try {
    const stored = sessionStorage.getItem("medclinic-session");
    return stored ? (JSON.parse(stored) as UserSession) : null;
  } catch (error) {
    console.warn("Não foi possível ler a sessão armazenada.", error);
    return null;
  }
}

function redirectToLogin() {
  window.location.href = getBasePath() + "login.html";
}

function getBasePath() {
  return window.location.pathname.includes("/pages/") ? "" : "pages/";
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    pending_payment: "Pendente Pagamento",
    paid: "Pago",
    scheduled: "Agendado",
    sample_collected: "Coletado",
    processing: "Processando",
    ready: "Pronto",
    delivered: "Liberado",
    cancelled: "Cancelado",
  };

  return map[status] ?? status;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending_payment:
      "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    paid: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    scheduled: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    sample_collected:
      "bg-purple-500/10 text-purple-500 border border-purple-500/20",
    processing: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    ready: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    delivered:
      "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-500 border border-red-500/20",
  };

  return map[status] ?? "bg-slate-800 text-slate-400 border border-slate-700";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderToasts() {
  if (!toastContainer) return;
  toastContainer.innerHTML = "";
  uiStore.getToasts().forEach((toast) => {
    const toastElement = document.createElement("div");
    toastElement.className =
      "rounded-lg px-4 py-2 text-sm shadow-lg border border-border-dark bg-surface-dark";
    toastElement.textContent = toast.text;
    toastContainer.appendChild(toastElement);
  });
}
