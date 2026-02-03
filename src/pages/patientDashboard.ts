import "../../css/pages/patient-dashboard.css"
import "../../css/global.css"
import { Navigation } from "../components/Navigation"
import { initTheme } from "../config/theme"
import { MobileMenu } from "../components/MobileMenu"
import { ToastContainer } from "../components/ToastContainer"
import { authStore } from "../stores/authStore"
import { dashboardStore } from "../stores/dashboardStore"
import {
  DASHBOARD_APPOINTMENTS_EVENT,
  type DashboardEventDetail,
} from "../stores/dashboardStore"
import { uiStore } from "../stores/uiStore"
import {
  listAppointments,
  cancelAppointment,
} from "../services/appointmentsService"

import type { AppointmentSummary } from "../types/appointments"
import type { UserSession } from "../types/auth"
import type { PrescriptionSummary } from "../types/prescriptions"
import { openPrescriptionModal } from "./prescriptionModal"
import { openAppointmentModal } from "./appointmentModal"
import { formatSpecialty } from "../utils/formatters"

const nextAppointmentContainer = document.querySelector(
  "[data-next-appointment]",
) as HTMLElement
const activityList = document.querySelector(
  "[data-activity-list]",
) as HTMLTableSectionElement | null
const emptyStateContainer = document.querySelector(
  "[data-empty-appointments]",
) as HTMLElement
const prescriptionsContainer = document.getElementById(
  "prescriptions-container",
) as HTMLElement

let toastContainer: ToastContainer
let navigation: Navigation

document.addEventListener("DOMContentLoaded", () => {
  toastContainer = new ToastContainer()
  navigation = new Navigation()
  new MobileMenu()
  initTheme()
  hydrateSessionUser()
  window.addEventListener(
    DASHBOARD_APPOINTMENTS_EVENT,
    handleDashboardUpdate as EventListener,
  );
  init();
});

async function init() {
  const session = await authStore.refreshSession();

  hydrateSessionUser();

  if (!session) {
    window.location.href = "/pages/login.html";
    return;
  }

  if (session.role !== "patient") {
    uiStore.addToast("warning", "Acesso restrito a pacientes.");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return;
  }

  // Load dashboard data for patient
  await dashboardStore.loadAppointmentsForSession(session);
}

function hydrateSessionUser() {
  const session = getSessionFromStorage() ?? authStore.getSession();
  if (!session) return;

  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = session.name || "Usuário";
  });

  document.querySelectorAll("[data-user-initials]").forEach((element) => {
    element.textContent = getInitials(session.name || "U");
  });
}

function handleDashboardUpdate(event: CustomEvent<DashboardEventDetail>) {
  const detail = event.detail;
  if (!detail) return;

  renderNextAppointment(detail.appointments, detail.isLoading, detail.hasError);
  renderPrescriptions(detail.prescriptions, detail.isLoading, detail.hasError);
  renderActivity(
    detail.appointments,
    detail.prescriptions,
    detail.isLoading,
    detail.hasError,
  );
}

function renderNextAppointment(
  appointments: AppointmentSummary[],
  isLoading: boolean,
  hasError: boolean,
) {
  if (!nextAppointmentContainer) return;

  // Find child elements to populate
  const avatarEl = nextAppointmentContainer.querySelector(
    ".doctor-avatar",
  ) as HTMLElement;
  const statusBadgeEl = nextAppointmentContainer.querySelector(".status-badge");
  const nameEl = nextAppointmentContainer.querySelector(".appointment-name");
  const specialtyEl = nextAppointmentContainer.querySelector(
    ".appointment-specialty",
  );
  const metaItems = nextAppointmentContainer.querySelectorAll(".meta-item");
  const detailsBtn =
    nextAppointmentContainer.querySelector(".btn-small-primary");
  const rescheduleBtn =
    nextAppointmentContainer.querySelector(".btn-small-outline");

  if (isLoading) {
    // Show card with loading state
    const containerEl = nextAppointmentContainer as HTMLElement;
    containerEl.style.display = "";

    if (nameEl) nameEl.textContent = "Carregando...";
    if (specialtyEl) specialtyEl.textContent = "";
    if (statusBadgeEl) statusBadgeEl.textContent = "";

    return;
  }

  if (hasError) {
    hideAppointmentCard();
    showEmptyState();
    return;
  }

  const upcoming = getUpcomingAppointment(appointments);
  if (!upcoming) {
    hideAppointmentCard();
    showEmptyState();
    return;
  }

  // Hide empty state and show card
  hideEmptyState();
  const containerEl = nextAppointmentContainer as HTMLElement;
  if (containerEl.style.display === "none") {
    containerEl.style.display = "";
  }

  // Populate data into existing HTML structure
  // Note: professional_avatar not available in current API, using placeholder
  if (avatarEl) {
    // Keep existing background image from HTML or use placeholder
    if (!avatarEl.style.backgroundImage) {
      avatarEl.style.backgroundColor = "var(--primary-10)";
    }
  }

  if (statusBadgeEl) {
    statusBadgeEl.textContent = formatStatus(upcoming.status);
    statusBadgeEl.className = "status-badge"; // Reset
    if (upcoming.status === "confirmed") {
      statusBadgeEl.classList.add("status-badge--confirmed");
    }
  }

  if (nameEl) {
    nameEl.textContent = upcoming.professional_name;
  }

  if (specialtyEl) {
    specialtyEl.textContent = formatSpecialty(upcoming.specialty);
  }

  // Populate meta items (date, time, location)
  if (metaItems.length >= 3) {
    // Each meta-item has: <span>icon</span> + text node
    // We need to REPLACE all text content (remove old, add new)
    const dateItem = metaItems[0] as HTMLElement;
    const timeItem = metaItems[1] as HTMLElement;
    const locationItem = metaItems[2] as HTMLElement;

    // Helper to replace ALL text content after icon
    const replaceText = (element: HTMLElement, newText: string) => {
      // Remove all text nodes
      Array.from(element.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          element.removeChild(node);
        }
      });
      // Add new text node with spacing
      element.appendChild(
        document.createTextNode(
          "\n                                " +
            newText +
            "\n                            ",
        ),
      );
    };

    replaceText(dateItem, formatDate(upcoming.date));
    replaceText(timeItem, upcoming.time);
    replaceText(
      locationItem,
      upcoming.room ? `Sala ${upcoming.room}` : "Unidade MedClinic",
    );
  }

  // Attach event handlers
  if (detailsBtn) {
    const newDetailsBtn = detailsBtn.cloneNode(true);
    detailsBtn.replaceWith(newDetailsBtn);
    newDetailsBtn.addEventListener("click", () => {
      openAppointmentModal(upcoming.id, "details");
    });
  }

  if (rescheduleBtn) {
    const newRescheduleBtn = rescheduleBtn.cloneNode(true);
    rescheduleBtn.replaceWith(newRescheduleBtn);
    newRescheduleBtn.addEventListener("click", () => {
      openAppointmentModal(upcoming.id, "reschedule");
    });
  }
}

function hideAppointmentCard() {
  if (nextAppointmentContainer) {
    (nextAppointmentContainer as HTMLElement).style.display = "none";
  }
}

function showEmptyState() {
  const emptyState = document.querySelector(
    "[data-empty-appointments]",
  ) as HTMLElement;
  if (emptyState) {
    emptyState.style.display = "";
  }
}

function hideEmptyState() {
  const emptyState = document.querySelector(
    "[data-empty-appointments]",
  ) as HTMLElement;
  if (emptyState) {
    emptyState.style.display = "none";
  }
}

function renderPrescriptions(
  prescriptions: PrescriptionSummary[],
  isLoading: boolean,
  hasError: boolean,
) {
  const prescriptionsContainer = document.getElementById(
    "prescriptions-container",
  );
  if (!prescriptionsContainer) return;

  if (isLoading) {
    prescriptionsContainer.innerHTML = `
      <div class="prescription-card prescription-card--state">
        <div class="prescription-card__message">
          <span class="material-symbols-outlined u-spin">sync</span>
          Carregando prescrições...
        </div>
      </div>
    `;
    return;
  }

  if (hasError || !prescriptions) {
    prescriptionsContainer.innerHTML = `
      <div class="prescription-card prescription-card--state">
        <div class="prescription-card__content-state">
          <p>Não foi possível carregar suas prescrições.</p>
          <p class="prescription-card__submessage">Tente novamente mais tarde.</p>
        </div>
      </div>
    `;
    return;
  }

  if (prescriptions.length === 0) {
    prescriptionsContainer.innerHTML = `
      <div class="prescription-card prescription-card--state">
        <div class="prescription-card__content-state">
          <p>Nenhuma prescrição ativa.</p>
          <p class="prescription-card__submessage">Suas prescrições médicas aparecerão aqui.</p>
        </div>
      </div>
    `;
    return;
  }

  // Show only the 3 most recent prescriptions
  const recentPrescriptions = prescriptions.slice(0, 3);
  prescriptionsContainer.innerHTML = `
    <div class="prescription-card">
      <div class="prescription-card__content">
      ${recentPrescriptions
        .map(
          (p) => `
          <div class="prescription-item">
            <div class="prescription-item__container">
              <!-- Icon + Info -->
              <div class="prescription-item__icon-group">
                <div class="prescription-item__icon">
                  <span class="material-symbols-outlined">medication</span>
                </div>
                <div class="prescription-item__info">
                  <!-- Name: Larger, wrapped, no truncate -->
                  <p class="prescription-item__title">${p.medication_name}</p>
                  
                  <!-- Dosage -->
                  ${p.dosage ? `<p class="prescription-item__dosage">${p.dosage}</p>` : ""}
                  
                  <!-- Date (Smaller) -->
                  <p class="prescription-item__date">
                    <span class="material-symbols-outlined">calendar_today</span>
                    ${formatDate(p.created_at)}
                  </p>
                </div>
              </div>
              
              <!-- Action Button (Small, always visible) -->
              <button 
                data-prescription-id="${p.id}"
                class="prescription-item__btn"
                title="Ver detalhes"
              >
                <span class="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>
        `,
        )
        .join("")}
      </div>
      ${
        prescriptions.length > 3
          ? `
        <div class="prescription-card__footer">
          <p class="prescription-card__more-text">
            +${prescriptions.length - 3} prescrição${prescriptions.length - 3 > 1 ? "ões" : ""} anterior${prescriptions.length - 3 > 1 ? "es" : ""}
          </p>
        </div>
      `
          : ""
      }
    </div>
  `;

  // Attach click handlers to Details buttons
  prescriptionsContainer
    .querySelectorAll(".prescription-item__btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Use currentTarget to ensure we get the button element, even if icon was clicked
        const target = e.currentTarget as HTMLElement;
        const prescriptionId = parseInt(
          target.getAttribute("data-prescription-id") || "0",
        );
        if (prescriptionId) {
          openPrescriptionModal(prescriptionId);
        }
      });
    });
}

function renderActivity(
  appointments: AppointmentSummary[],
  prescriptions: PrescriptionSummary[],
  isLoading: boolean,
  hasError: boolean,
) {
  if (!activityList) return;

  if (isLoading) {
    activityList.innerHTML = buildActivityRow(
      "sync",
      "Carregando atividades recentes...",
      "",
      "activity-icon-neutral",
    );
    return;
  }

  if (hasError) {
    activityList.innerHTML = buildActivityRow(
      "error",
      "Não foi possível carregar suas atividades.",
      "",
      "activity-icon-warning",
    );
    return;
  }

  const items = buildActivityItems(appointments, prescriptions);

  if (items.length === 0) {
    activityList.innerHTML = buildActivityRow(
      "calendar_month",
      "Nenhuma atividade recente encontrada.",
      "",
      "activity-icon-neutral",
    );
    return;
  }

  activityList.innerHTML = items
    .slice(0, 5)
    .map((item) =>
      buildActivityRow(item.icon, item.label, item.date, item.color),
    )
    .join("");
}

function buildActivityItems(
  appointments: AppointmentSummary[],
  prescriptions: PrescriptionSummary[],
) {
  // Filter out cancelled appointments from activity feed
  const activeAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "cancelled_by_patient" &&
      appointment.status !== "cancelled_by_clinic",
  );

  const appointmentItems = activeAppointments.map((appointment) => {
    let icon = "event";
    let color = "activity-icon-info";

    if (appointment.status === "completed") {
      icon = "check_circle";
      color = "activity-icon-success";
    } else if (appointment.status === "confirmed") {
      icon = "event_available";
      color = "activity-icon-success";
    }

    return {
      icon,
      color,
      date: formatDate(appointment.date),
      label: `Consulta ${formatStatus(appointment.status)}${appointment.professional_name ? ` com ${appointment.professional_name}` : ""}`,
      timestamp: toTimestamp(appointment.date),
    };
  });

  const prescriptionItems = prescriptions.map((prescription) => ({
    icon: "receipt_long",
    color: "activity-icon-warning",
    date: formatDate(prescription.created_at),
    label: `Prescrição de ${prescription.medication_name}`,
    timestamp: toTimestamp(prescription.created_at),
  }));

  return [...appointmentItems, ...prescriptionItems].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
}

function buildActivityRow(
  icon: string,
  label: string,
  date: string,
  colorClass: string,
) {
  return `
    <tr class="activity-table-row">
      <td class="activity-content-cell">
        <span class="material-symbols-outlined ${colorClass}">${icon}</span>
        ${label}
      </td>
      <td class="activity-date-cell">${date}</td>
    </tr>
  `;
}

function getUpcomingAppointment(appointments: AppointmentSummary[]) {
  return [...appointments]
    .filter((appointment) =>
      ["scheduled", "confirmed"].includes(appointment.status),
    )
    .sort(
      (a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time),
    )[0];
}

function getInitials(name: string) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    scheduled: "Agendada",
    confirmed: "Confirmada",
    completed: "Realizada",
    cancelled_by_patient: "Cancelada",
    cancelled_by_clinic: "Cancelada",
    waiting: "Aguardando",
  };

  return map[status] ?? status;
}

function formatDate(value: string) {
  if (!value) return value;

  // Handle both YYYY-MM-DD and YYYY-MM-DD HH:MM:SS formats
  let dateStr = value;

  // If it's a datetime string (has time component), extract just the date part
  if (value.includes(" ")) {
    dateStr = value.split(" ")[0];
  }

  // Append T12:00:00 to ensure we are in the middle of the day
  // preventing timezone shifts from T00:00:00 UTC to previous day
  if (!dateStr.includes("T")) {
    dateStr = `${dateStr}T12:00:00`;
  }

  const parsed = new Date(dateStr);

  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function toTimestamp(dateValue: string, timeValue?: string) {
  const date = timeValue
    ? `${dateValue}T${timeValue}`
    : `${dateValue}T12:00:00`;
  const parsed = new Date(date);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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

function getBasePath() {
  return window.location.pathname.includes("/pages/") ? "" : "pages/";
}
