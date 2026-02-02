import "../../css/global.css";
import "../../css/layout/admin-common.css";
import "../../css/pages/lab-dashboard.css";
import "../../css/components/sidebar.css";
import { Sidebar } from "../components/Sidebar";
import { MobileSidebar } from "../components/MobileSidebar";
import { Navigation } from "../components/Navigation";
import { ToastContainer } from "../components/ToastContainer";
import { SidebarItem } from "../types/sidebar.types";
import { listExams } from "../services/examsService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";
import type { ExamSummary } from "../types/exams";

const queueBody = document.querySelector("[data-lab-queue-body]");
const countElements: Record<string, HTMLElement | null> = {
  pending: document.querySelector("[data-lab-count='pending']"),
  analysis: document.querySelector("[data-lab-count='analysis']"),
  ready: document.querySelector("[data-lab-count='ready']"),
  urgent: document.querySelector("[data-lab-count='urgent']"),
};

let navigation: Navigation | null = null;
let toastContainer: ToastContainer | null = null;
console.log(1);

document.addEventListener("DOMContentLoaded", async () => {
  toastContainer = new ToastContainer();
  const session = await authStore.refreshSession();

  const sidebarItems: SidebarItem[] = [
    { text: 'Equipe', icon: 'group', href: 'users.html' },
    { text: 'Exames', icon: 'assignment', href: 'exams.html' },
  ];

  const sidebar = new Sidebar({
    brand: {
      name: 'MedClinic',
      icon: 'local_hospital',
      href: '#'
    },
    items: sidebarItems,
    targetId: 'sidebar-container',
    itemClass: 'nav-item',
    userProfile: session ? {
      name: session.name,
      role: session.role
    } : undefined
  });

  sidebar.render();
  new MobileSidebar();
  navigation = new Navigation();
  if (!session || session.role !== "lab_tech") {
    uiStore.addToast("warning", "Acesso restrito ao laboratório");
    window.location.href = "/pages/login.html";
    return;
  }

  await loadQueue();
});

async function loadQueue() {
  renderQueueLoading();

  try {
    const response = await listExams();
    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message ?? "Não foi possível carregar os exames",
      );
    }

    const exams = response.data;
    updateCounts(exams);
    renderQueueRows(exams);
  } catch (error) {
    console.error("Erro ao carregar exames:", error);
    uiStore.addToast("error", "Não foi possível carregar a fila de exames.");
    renderQueueError();
  }
}

function updateCounts(exams: ExamSummary[]) {
  const summary = exams.reduce(
    (acc, exam) => {
      const status = exam.status ?? "";
      if (status === "pending" || status === "PENDENTE") {
        acc.pending += 1;
      }
      if (status === "in_analysis" || status === "IN_ANALYSIS") {
        acc.analysis += 1;
      }
      if (
        status === "ready" ||
        status === "ready_to_review" ||
        status === "READY"
      ) {
        acc.ready += 1;
      }
      if (
        exam.urgency === "urgent" ||
        exam.urgency === "critical" ||
        status === "urgent"
      ) {
        acc.urgent += 1;
      }
      return acc;
    },
    { pending: 0, analysis: 0, ready: 0, urgent: 0 },
  );

  Object.entries(summary).forEach(([key, value]) => {
    const el = countElements[key];
    if (el) {
      el.textContent = String(value);
    }
  });
}

function renderQueueRows(exams: ExamSummary[]) {
  if (!queueBody) return;

  if (exams.length === 0) {
    queueBody.innerHTML = `
      <tr>
        <td colspan="5" class="table__empty">
          <p class="table__empty-text">Nenhum exame cadastrado no momento</p>
        </td>
      </tr>
    `;
    return;
  }

  queueBody.innerHTML = exams
    .map((exam) => {
      return buildExamRow(exam);
    })
    .join("");

  queueBody.querySelectorAll("[data-exam-action]").forEach((button) => {
    button.addEventListener("click", handleExamAction);
  });
}

function renderQueueLoading() {
  if (!queueBody) return;
  queueBody.innerHTML = `
    <tr>
      <td colspan="5" class="table__empty">
        <p class="table__empty-text">Carregando exames...</p>
      </td>
    </tr>
  `;
}

function renderQueueError() {
  if (!queueBody) return;
  queueBody.innerHTML = `
    <tr>
      <td colspan="5" class="table__empty">
        <p class="table__empty-text u-text-error">Erro ao carregar a fila. Tente novamente mais tarde.</p>
      </td>
    </tr>
  `;
}

function buildExamRow(exam: ExamSummary) {
  const patient = exam.patient_name ?? "Paciente";
  const requester = exam.requestingProfessionalName ?? "Solicitante";
  const badge = getStatusBadge(exam.status);
  const action = getActionForStatus(exam.status);

  return `
    <tr class="table__row" data-exam-row="${exam.id}">
      <td class="table__cell font-medium">${patient}</td>
      <td class="table__cell">${exam.exam_name}</td>
      <td class="table__cell table__cell--muted">${requester}</td>
      <td class="table__cell">${badge}</td>
      <td class="table__cell">
        <button
          class="btn btn--sm ${action.className}"
          data-exam-action="${exam.id}"
          data-action-type="${action.type}"
        >
          ${action.label}
        </button>
      </td>
    </tr>
  `;
}

function getStatusBadge(status: string | undefined) {
  const normalized = (status ?? "").toLowerCase();
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "PENDENTE", color: "warning" },
    in_analysis: { label: "EM ANÁLISE", color: "info" },
    ready: { label: "PRONTO", color: "success" },
    urgent: { label: "URGENTE", color: "error" },
  };

  const badge = map[normalized] || {
    label: normalized.toUpperCase() || "PENDENTE",
    color: "neutral",
  };

  return `<span class="badge badge--${badge.color}">${badge.label}</span>`;
}

function getActionForStatus(status: string | undefined) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "pending") {
    return { label: "INICIAR", type: "start", className: "btn--primary" };
  }
  if (normalized === "in_analysis") {
    return { label: "LIBERAR", type: "release", className: "btn--success" };
  }
  return {
    label: "DETALHES",
    type: "details",
    className: "btn--outline",
  };
}

function handleExamAction(event: Event) {
  const target = event.currentTarget as HTMLElement;
  const examIdAttr = target.getAttribute("data-exam-action");
  const actionType = target.getAttribute("data-action-type");

  if (!examIdAttr) return;
  const examId = Number(examIdAttr);

  uiStore.addToast(
    "info",
    `Ação '${actionType}' disparada para o exame ${examId}. Implementar hook real quando o backend disponibilizar essa operação.`,
  );
}
