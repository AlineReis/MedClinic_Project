import "../../css/pages/my-exams.css"
import { Navigation } from "../components/Navigation";
import { listExams } from "../services/examsService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";
import type { UserSession } from "../types/auth";
import type { ExamSummary } from "../types/exams";



const examsListContainer = document.getElementById("exams-list");
const toastContainer = document.getElementById("toast-container");

document.addEventListener("DOMContentLoaded", () => {
    new Navigation();
    hydrateSessionUser();
    loadMyExams();

    // Subscribe to toast updates
    uiStore.subscribe((toasts) => {
        if (!toastContainer) return;
        toastContainer.innerHTML = toasts.map(toast => `
            <div class="toast-item toast-item-${toast.level} animate-slide-up">
                ${toast.text}
            </div>
        `).join('');
    });
});

async function hydrateSessionUser() {
    const session = await authStore.refreshSession();
    if (!session) return;

    // Name
    document.querySelectorAll("[data-user-name]").forEach(el => {
        el.textContent = session.name || "Usuário";
    });

    // Initials
    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = getInitials(session.name || "U");
    });

    // Logout Logic is managed by Navigation component
}

async function loadMyExams() {
    const session = await authStore.refreshSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // Force filter to patientId
    const filters = { patientId: session.id };

    // UI Loading? HTML already has loader.

    const response = await listExams(filters);

    if (!response.success || !response.data) {
        if (examsListContainer) {
            examsListContainer.innerHTML = buildErrorState(response.error?.message ?? "Erro ao carregar exames.");
        }
        return;
    }

    const exams = response.data;
    renderExamsList(exams);
}

function renderExamsList(exams: ExamSummary[]) {
    if (!examsListContainer) return;

    if (exams.length === 0) {
        examsListContainer.innerHTML = buildEmptyState();
        return;
    }

    // Build Table Structure
    const tableHTML = `
        <div class="exams-table-container">
            <table class="exams-table">
                <thead class="exams-table__header">
                    <tr>
                        <th class="exams-table__th">Exame</th>
                        <th class="exams-table__th">Data / ID</th>
                        <th class="exams-table__th">Status</th>
                        <th class="exams-table__th">Ação</th>
                    </tr>
                </thead>
                <tbody class="exams-table__body">
                    ${exams.map(buildExamRow).join('')}
                </tbody>
            </table>
        </div>
    `;

    examsListContainer.innerHTML = tableHTML;

    // Attach event listeners
    attachViewListeners();
}

function buildExamRow(exam: ExamSummary) {
    const statusClass = `status-badge--${exam.status}`;
    const statusLabel = formatStatus(exam.status);

    // View Action (Only if Delivered/Ready)
    const canView = exam.status === 'delivered' || exam.status === 'ready';
    const actionBtn = canView
        ? `<button data-view-url="${exam.result}" data-exam-id="${exam.id}" class="action-btn action-btn--view">
             <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>
             Ver Resultado
           </button>`
        : `<span class="action-btn action-btn--disabled">
             <span class="material-symbols-outlined" style="font-size: 18px;">hourglass_empty</span>
             Em análise
           </span>`;

    return `
        <tr class="exams-table__row">
            <td class="exams-table__td">
                <span class="exams-table__exam-name">${exam.exam_name}</span>
            </td>
            <td class="exams-table__td">
                <span class="exams-table__exam-id">ID: #${exam.id}</span>
                <!-- Future: Date logic here if available in summary -->
            </td>
            <td class="exams-table__td">
                <span class="status-badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td class="exams-table__td">
                ${actionBtn}
            </td>
        </tr>
    `;
}

function buildEmptyState() {
    return `
        <div class="empty-state">
            <span class="material-symbols-outlined empty-state__icon">science</span>
            <h3 class="empty-state__title">Nenhum exame encontrado</h3>
            <p class="empty-state__text">Você ainda não possui solicitações de exames registradas.</p>
        </div>
    `;
}

function buildErrorState(msg: string) {
    return `
        <div class="empty-state">
             <span class="material-symbols-outlined empty-state__icon" style="color: var(--danger);">error</span>
             <h3 class="empty-state__title">Erro ao carregar</h3>
             <p class="empty-state__text">${msg}</p>
        </div>
    `;
}

function attachViewListeners() {
    document.querySelectorAll("[data-view-url]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const el = e.currentTarget as HTMLElement;
            const url = el.dataset.viewUrl;
            const id = el.dataset.examId;

            // Same logic as examsPage.ts: Prefer URL, fallback to download endpoint
            if (url && url !== "null" && url.trim() !== "") {
                window.open(url, "_blank");
            } else if (id) {
                // Call download endpoint
                handleDownload(parseInt(id));
            }
        });
    });
}

// Reusing download logic from examsPage.ts (duplicated here to avoid tight coupling or import issues with 'pages' folder, 
// strictly speaking we should extract this to a service or util, but for now copying is safer to isolate 'myExams').
async function handleDownload(examId: number) {
    const apiHost = (window as any).CLINIC_API_HOST ?? "http://localhost:3000/api/v1/1";
    const downloadEndpoint = `${apiHost}/exams/${examId}/download`;

    try {
        uiStore.addToast("info", "Abrindo laudo...");

        // Direct fetch to get the JSON with the link
        const response = await fetch(downloadEndpoint, {
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (!response.ok) throw new Error("Erro ao obter link.");

        const data = await response.json();
        if (data.success && data.result_file_url) {
            const fileUrl = data.result_file_url.startsWith("http")
                ? data.result_file_url
                : `${apiHost.replace("/api/v1/1", "")}${data.result_file_url}`;
            window.open(fileUrl, "_blank");
        } else {
            uiStore.addToast("error", "Arquivo não disponível.");
        }
    } catch (e) {
        console.error(e);
        uiStore.addToast("error", "Erro ao abrir laudo.");
    }
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

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
