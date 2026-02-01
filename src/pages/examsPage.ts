import { listAppointments } from "../services/appointmentsService";
import { logout } from "../services/authService";
import {
  createExam,
  listCatalog,
  listExams,
  releaseExamResult,
  uploadExamResult,
} from "../services/examsService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";
import type { UserSession } from "../types/auth";
import type { ExamSummary } from "../types/exams";

const toastContainer = document.getElementById("toast-container");
let currentView: "all" | "history" = "all";

document.addEventListener("DOMContentLoaded", () => {
  const session = getSessionFromStorage() ?? authStore.getSession();
  if (!session) {
    redirectToLogin();
    return;
  }
  
  hydrateSessionUser(session);
  renderNavigation(session);
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
  const toggleHistory = () => {
    currentView = currentView === "all" ? "history" : "all";
    loadExams();
  };

  document
    .getElementById("toggle-history")
    ?.addEventListener("click", toggleHistory);
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const historyLink = target.closest("#sidebar-history-link");
    if (historyLink) {
      e.preventDefault();
      toggleHistory();
    }
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
        <td colspan="5" class="table__empty">
          Nenhum exame encontrado.
        </td>
      </tr>
    `
    return
  }

  tableBody.innerHTML = exams
    .map((exam) => buildExamRow(exam, session))
    .join("")

  // Attach event listeners para botões
  attachActionButtons(session)
  attachViewButtons()
  updateUIForRole(session.role)
}

function buildExamRow(exam: ExamSummary, session: UserSession) {
  // Nome do paciente: da sessão se for patient, senão do exam
  const patientName =
    session.role === "patient" ? session.name : (exam.patient_name ?? "N/A")

  return `
    <tr class="table__row">
      <td class="table__cell">
        <p style="font-weight: 700; font-size: 0.875rem;">${patientName}</p>
        <p style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${exam.id}</p>
      </td>
      <td class="table__cell">
        <p style="font-size: 0.875rem;">${exam.exam_name}</p>
      </td>
      <td class="table__cell">
        <span class="${getStatusBadge(exam.status)}">
          ${formatStatus(exam.status)}
        </span>
      </td>
      <td class="table__cell u-text-center">
        ${getUrgencyIcon(exam.urgency)}
      </td>
      <td class="table__cell">
        ${getActionButton(exam, session.role)}
      </td>
    </tr>
  `
}

function getUrgencyIcon(urgency?: string) {
  if (urgency === "urgent" || urgency === "critical") {
    return '<span class="material-symbols-outlined u-text-error u-pulse">priority_high</span>'
  }
  return '<span class="material-symbols-outlined u-text-secondary">priority_high</span>'
}

function getActionButton(exam: ExamSummary, role: string) {
  if (role === "patient") {
    // Only show button if result is available
    if (exam.status === "delivered" || exam.status === "ready") {
      return `<button data-view="${exam.result}" data-exam-id="${exam.id}" class="btn btn--text btn--sm">VER DETALHES</button>`;
    }
    return `<span class="u-text-secondary" style="font-size: 0.75rem;">Em análise</span>`;
  }

  // Doctor (Health Professional) - view only (maybe download if status is delivered?)
  // Docs say: "Ver resultados que solicitou".
  if (role === "health_professional") {
    if (exam.status === "delivered" || exam.status === "ready") {
      return `<button data-view="${exam.result}" data-exam-id="${exam.id}" class="btn btn--text btn--sm u-text-success">VER LAUDO</button>`;
    }
    return "—";
  }

  // Lab Tech / Admin
  if (
    role === "lab_tech" ||
    role === "clinic_admin" ||
    role === "system_admin"
  ) {
    if (
      exam.status === "pending_payment" ||
      exam.status === "paid" ||
      exam.status === "scheduled" ||
      // Allow re-upload
      exam.status === "ready"
    ) {
      // If ready, show Upload (to re-upload) AND Release?
      // For simplicity, sticking to Upload logic.
      // Use a container for multiple actions if needed, but here we return one string.
      if (exam.status === "ready") {
        return `
             <div class="flex gap-2">
                <button data-upload="${exam.id}" class="btn btn--text btn--sm">RE-UPLOAD</button>
                <button data-release="${exam.id}" class="btn btn--primary btn--sm">LIBERAR</button>
             </div>`;
      }
      return `<button data-upload="${exam.id}" class="btn btn--text btn--sm">UPLOAD LAUDO</button>`;
    }

    if (exam.status === "delivered") {
      return `<button data-view="${exam.result}" class="btn btn--text btn--sm u-text-success">VER LAUDO</button>`;
    }
  }

  return "—";
}

function attachActionButtons(session: UserSession) {
  // Logic specifically for Lab Tech and Admin (Upload, Release, Download)
  if (session.role === "lab_tech" || session.role === "clinic_admin") {
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

    // Download buttons
    document.querySelectorAll("[data-download]").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const examId = parseInt(
          (e.currentTarget as HTMLElement).getAttribute("data-download")!,
        );
        await handleDownload(examId);
      });
    });
  }

  // Dynamic button injection removed to avoid duplicates with static HTML
  // if (session.role === "health_professional") { ... }
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

async function handleDownload(examId: number) {
  const apiHost =
    (window as any).CLINIC_API_HOST ?? "http://localhost:3000/api/v1/1";
  const downloadEndpoint = `${apiHost}/exams/${examId}/download`;

  try {
    uiStore.addToast("info", "Obtendo link do laudo...");
    renderToasts();

    // Fetch the JSON response first
    const response = await fetch(downloadEndpoint, {
      headers: {
        "Content-Type": "application/json",
        // Include credentials if needed by your backend auth
        // "Authorization": "Bearer ... "
      },
      // If utilizing cookie-based auth, ensure credentials are included
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao obter link.`);
    }

    const data = await response.json();

    if (data.success && data.result_file_url) {
      // Construct full URL if it's relative
      const fileUrl = data.result_file_url.startsWith("http")
        ? data.result_file_url
        : `${apiHost.replace("/api/v1/1", "")}${data.result_file_url}`;

      window.open(fileUrl, "_blank");
      uiStore.addToast("success", "Laudo aberto em nova aba.");
    } else {
      uiStore.addToast("error", "URL do arquivo não encontrada na resposta.");
    }
  } catch (error) {
    console.error("Download error:", error);
    uiStore.addToast("error", "Erro ao processar download.");
  }
  renderToasts();
}

const newRequestModalHtml = `
  <div id="new-request-modal" class="modal-overlay hidden" style="z-index: 50;">
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">Nova Solicitação de Exame</h2>
      </div>
      <div class="modal__content">
        <form id="new-request-form" class="form">
          <div class="form__group">
            <label class="form__label">Consulta (Contexto)</label>
            <select id="request-appointment" class="select" required>
              <option value="">Carregando consultas...</option>
            </select>
          </div>
          <div class="form__group">
             <label class="form__label">Paciente</label>
             <input type="text" id="request-patient-name" class="input" disabled value="Selecione uma consulta" />
             <input type="hidden" id="request-patient-id" />
          </div>
          <div class="form__group">
            <label class="form__label">Tipo de Exame</label>
            <select id="request-exam" class="select" required>
              <option value="">Carregando exames...</option>
            </select>
          </div>
          <div class="form__group">
            <label class="form__label">Urgência</label>
            <select id="request-urgency" class="select">
              <option value="normal">Normal</option>
              <option value="urgent">Urgente</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div class="form__group">
            <label class="form__label">Indicação Clínica</label>
            <textarea id="request-indication" rows="3" class="textarea" required></textarea>
          </div>
          <div class="modal__footer">
            <button type="button" id="cancel-request" class="btn btn--outline">Cancelar</button>
            <button type="submit" class="btn btn--primary">Solicitar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
`

function handleNewRequest() {
  if (!document.getElementById("new-request-modal")) {
    document.body.insertAdjacentHTML("beforeend", newRequestModalHtml);
    setupModalListeners();
  }

  const modal = document.getElementById("new-request-modal");
  if (modal) {
    modal.classList.remove("hidden");
    loadModalData();
  }
}

function setupModalListeners() {
  const form = document.getElementById("new-request-form") as HTMLFormElement;
  const cancelBtn = document.getElementById("cancel-request");
  const appointmentSelect = document.getElementById(
    "request-appointment",
  ) as HTMLSelectElement;

  cancelBtn?.addEventListener("click", closeModal);

  appointmentSelect?.addEventListener("change", (e) => {
    const option = (e.target as HTMLSelectElement).selectedOptions[0];
    if (option && option.dataset.patientName) {
      (
        document.getElementById("request-patient-name") as HTMLInputElement
      ).value = option.dataset.patientName;
      (
        document.getElementById("request-patient-id") as HTMLInputElement
      ).value = option.dataset.patientId!;
    } else {
      (
        document.getElementById("request-patient-name") as HTMLInputElement
      ).value = "Selecione uma consulta";
      (
        document.getElementById("request-patient-id") as HTMLInputElement
      ).value = "";
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const appointmentId = parseInt(appointmentSelect.value);
    const patientId = parseInt(
      (document.getElementById("request-patient-id") as HTMLInputElement).value,
    );
    const examCatalogId = parseInt(
      (document.getElementById("request-exam") as HTMLSelectElement).value,
    );
    const urgency = (
      document.getElementById("request-urgency") as HTMLSelectElement
    ).value as any;
    const indication = (
      document.getElementById("request-indication") as HTMLTextAreaElement
    ).value;

    if (!appointmentId || !patientId || !examCatalogId) {
      uiStore.addToast("error", "Preencha todos os campos obrigatórios.");
      return;
    }

    uiStore.addToast("info", "Criando solicitação...");
    renderToasts();

    const response = await createExam({
      appointment_id: appointmentId,
      patient_id: patientId,
      exam_catalog_id: examCatalogId,
      clinical_indication: indication,
      urgency: urgency,
    });

    if (response.success) {
      uiStore.addToast("success", "Exame solicitado com sucesso!");
      renderToasts();
      closeModal();
      loadExams();
    } else {
      uiStore.addToast(
        "error",
        response.error?.message ?? "Erro ao solicitar exame",
      );
      renderToasts();
    }
  });
}

function closeModal() {
  const modal = document.getElementById("new-request-modal");
  modal?.classList.add("hidden");
  (document.getElementById("new-request-form") as HTMLFormElement)?.reset();
  // Remove default select text
  (document.getElementById("request-patient-name") as HTMLInputElement).value =
    "Selecione uma consulta";
}

async function loadModalData() {
  const session = authStore.getSession();
  if (!session) return;

  // Load Appointments
  try {
    console.log(
      "loadModalData: Fetching appointments for professional",
      session.id,
    );
    const appResponse = await listAppointments({
      professionalId: session.id,
      pageSize: 50,
      upcoming: true,
    });

    // Fallback if upcoming returns nothing? No, keep it specific.

    const appSelect = document.getElementById(
      "request-appointment",
    ) as HTMLSelectElement;

    if (
      appResponse.success &&
      appResponse.data &&
      appResponse.data.appointments &&
      appResponse.data.appointments.length > 0
    ) {
      console.log(
        "loadModalData: Appointments found",
        appResponse.data.appointments.length,
      );
      appSelect.innerHTML =
        '<option value="">Selecione uma consulta...</option>' +
        appResponse.data.appointments
          .map(
            (app) =>
              `<option value="${app.id}" data-patient-id="${app.patient_id}" data-patient-name="${app.patient_name}">
                      ${app.date} ${app.time} - ${app.patient_name}
                  </option>`,
          )
          .join("");
    } else {
      console.warn(
        "loadModalData: No appointments found for professional",
        session.id,
        appResponse,
      );
      appSelect.innerHTML =
        '<option value="">Nenhuma consulta encontrada (Verifique seus agendamentos)</option>';
    }
  } catch (error) {
    console.error("loadModalData: Error fetching appointments", error);
    const appSelect = document.getElementById(
      "request-appointment",
    ) as HTMLSelectElement;
    if (appSelect)
      appSelect.innerHTML =
        '<option value="">Erro ao carregar consultas</option>';
  }

  // Load Catalog
  try {
    console.log("loadModalData: Fetching catalog");
    const catResponse = await listCatalog();
    const catSelect = document.getElementById(
      "request-exam",
    ) as HTMLSelectElement;

    if (catResponse.success && catResponse.data) {
      console.log("loadModalData: Catalog loaded", catResponse.data.length);
      const requestExamSelect = document.getElementById(
        "request-exam",
      ) as HTMLSelectElement;
      if (requestExamSelect) {
        requestExamSelect.innerHTML =
          '<option value="">Selecione um exame...</option>' +
          catResponse.data
            .filter((i) => i.is_active)
            .map(
              (item) =>
                `<option value="${item.id}">${item.exam_name} (R$ ${item.base_price})</option>`,
            )
            .join("");
      }
    } else {
      console.warn("loadModalData: Catalog fetch failed", catResponse);
      const catSelect = document.getElementById(
        "request-exam",
      ) as HTMLSelectElement;
      if (catSelect)
        catSelect.innerHTML =
          '<option value="">Erro ao carregar exames.</option>';
    }
  } catch (error) {
    console.error("loadModalData: Error fetching catalog", error);
    const catSelect = document.getElementById(
      "request-exam",
    ) as HTMLSelectElement;
    if (catSelect)
      catSelect.innerHTML =
        '<option value="">Erro crítico ao buscar exames.</option>';
  }
}

function hydrateSessionUser(session: UserSession) {
  if (!session) return;

  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = session.name;
  });

  document.querySelectorAll("[data-user-initials]").forEach((element) => {
    element.textContent = getInitials(session.name);
  });

  document.querySelectorAll("[data-user-role]").forEach((element) => {
    const roleMap: Record<string, string> = {
      patient: "Paciente",
      health_professional: "Profissional de Saúde",
      lab_tech: "Técnico de Laboratório",
      receptionist: "Recepcionista",
      clinic_admin: "Administrador",
      system_admin: "Admin Sistema",
    };
    element.textContent = roleMap[session.role] ?? "Usuário";
  });
}

function renderNavigation(session: UserSession) {
  const navContainer = document.querySelector("[data-nav-container]");
  if (!navContainer) return;

  const basePath = getBasePath();
  let navItems = "";

  if (session.role === "patient") {
    navItems = `
      <a class="admin-nav-item" href="${basePath}patient-dashboard.html">
        <span class="material-symbols-outlined">dashboard</span>
        Inicio
      </a>
      <a class="admin-nav-item" href="${basePath}my-appointments.html">
        <span class="material-symbols-outlined">event_note</span>
        Consultas
      </a>
      <a class="admin-nav-item active" href="${basePath}exams.html">
        <span class="material-symbols-outlined">science</span>
        Exames
      </a>
    `;
  } else if (session.role === "lab_tech") {
    navItems = `
      <a class="admin-nav-item" href="${basePath}lab-dashboard.html">
        <span class="material-symbols-outlined">dashboard</span>
        Painel
      </a>
      <a class="admin-nav-item active" href="${basePath}exams.html">
        <span class="material-symbols-outlined">assignment</span>
        Solicitações
      </a>
      <a class="admin-nav-item" id="sidebar-history-link" href="#">
        <span class="material-symbols-outlined">history</span>
        Histórico
      </a>
    `;
    // Update Branding for Lab Tech
    const brandName = document.querySelector("[data-dynamic-brand-name]");
    const brandIcon = document.querySelector("[data-dynamic-brand-icon]");
    const brandLink = document.querySelector("[data-dynamic-brand-link]");
    if (brandName) brandName.textContent = "MedClinic Labs";
    if (brandIcon) brandIcon.textContent = "science";
    if (brandLink) brandLink.setAttribute("href", `${basePath}lab-dashboard.html`);
    
    const headerTitle = document.querySelector(".admin-header-title");
    if (headerTitle) headerTitle.textContent = "Solicitações de Exames";
  } else {
    // Default fallback for other roles
    const dashboardLink = getDashboardForRole(session.role);
    navItems = `
      <a class="admin-nav-item" href="${basePath}${dashboardLink}">
        <span class="material-symbols-outlined">dashboard</span>
        Inicio
      </a>
      <a class="admin-nav-item active" href="${basePath}exams.html">
        <span class="material-symbols-outlined">science</span>
        Exames
      </a>
    `;
    const brandLink = document.querySelector("[data-dynamic-brand-link]");
    if (brandLink) brandLink.setAttribute("href", `${basePath}${dashboardLink}`);
  }

  navContainer.innerHTML = navItems;
}

function getDashboardForRole(role: string): string {
  const map: Record<string, string> = {
    receptionist: "reception-dashboard.html",
    health_professional: "doctor-dashboard.html",
    clinic_admin: "manager-dashboard.html",
    system_admin: "admin-dashboard.html",
  };
  return map[role] ?? "dashboard.html";
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
    pending_payment: "Pendente",
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
      "badge badge--warning",
    paid: "badge badge--info",
    scheduled: "badge badge--info",
    sample_collected:
      "badge badge--warning",
    processing: "badge badge--info",
    ready: "badge badge--success",
    delivered:
      "badge badge--success",
    cancelled: "badge badge--error",
  }

  return map[status] ?? "badge badge--neutral"
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
function attachViewButtons() {
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const resultUrl = (e.currentTarget as HTMLElement).getAttribute(
        "data-view",
      );
      // If we have a direct URL, use it. Otherwise, try to derive it from ID if possible,
      // but data-view usually holds the result string.
      // If the backend returns "result_file_url" as the `result` field in mapExamSummary, it should be here.

      if (
        resultUrl &&
        resultUrl !== "null" &&
        resultUrl !== "undefined" &&
        resultUrl.trim() !== ""
      ) {
        window.open(resultUrl, "_blank");
      } else {
        // Fallback: try to get the ID from the row context?
        // Actually, let's use the valid `handleDownload` logic which constructs the URL.
        // We need the ID. Let's assume the button is inside a row that has the ID,
        // OR we can change getActionButton to put the ID in data-view-id attribute.
        // For now, let's try to parse the button's parent row or add data-id to the button in getActionButton.
        const btnEl = e.currentTarget as HTMLElement;
        const examId = btnEl.getAttribute("data-exam-id");

        if (examId) {
          handleDownload(parseInt(examId));
        } else {
          uiStore.addToast("warning", "Visualização indisponível no momento.");
          renderToasts();
        }
      }
    });
  });
}

function updateUIForRole(role: string) {
  const newRequestBtn = document.getElementById("new-request-btn");
  if (newRequestBtn) {
    if (role === "health_professional") {
      newRequestBtn.classList.remove("hidden");
      newRequestBtn.onclick = handleNewRequest;
    } else {
      newRequestBtn.classList.add("hidden");
    }
  }
}
