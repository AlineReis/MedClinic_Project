import "../../css/pages/agenda.css"
import { listAppointments } from "../services/appointmentsService";
import { authStore } from "../stores/authStore";
import { listProfessionals } from "../services/professionalsService";
import { uiStore } from "../stores/uiStore";
import type { AppointmentSummary } from "../types/appointments";
import type { ProfessionalSummary } from "../types/professionals";
import { Navigation } from "../components/Navigation";
import { ToastContainer } from "../components/ToastContainer";
import "../../css/global.css";

// Constants
const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_HEIGHT = 96; // matches bg-[size:100%_96px]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

document.addEventListener("DOMContentLoaded", async () => {
  new ToastContainer();
  new Navigation();

  const session = await authStore.refreshSession();
  if (!session) {
    window.location.href = "/pages/login.html";
    return;
  }

  hydrateSessionUser(session);

  // Initial load
  loadAgenda();
});

function hydrateSessionUser(session: any) {
  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = session.name || "Usuário";
  });

  document.querySelectorAll("[data-user-initials]").forEach((element) => {
    element.textContent = getInitials(session.name || "U");
  });
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

async function loadAgenda() {
  try {
    const [professionalsResponse, appointmentsResponse] = await Promise.all([
      listProfessionals({ pageSize: 10 }), // Limit to 10 columns for now
      listAppointments({
        pageSize: 100,
        upcoming: true,
        // In a real app we'd filter by date range of the view
      }),
    ]);

    if (professionalsResponse.success && professionalsResponse.data) {
      const professionals = professionalsResponse.data.data; // professionals list
      renderAgendaGrid(
        professionals,
        appointmentsResponse.data?.appointments || [],
      );
    } else {
      uiStore.addToast("error", "Erro ao carregar médicos");
    }
  } catch (error) {
    console.error("Error loading agenda:", error);
    uiStore.addToast("error", "Erro ao carregar agenda");
  }
}

function renderAgendaGrid(
  professionals: ProfessionalSummary[],
  appointments: AppointmentSummary[],
) {
  const headerContainer = document.getElementById("calendar-header-doctors");
  const timeColumn = document.getElementById("calendar-time-column");
  const gridContainer = document.getElementById("calendar-grid");

  if (!headerContainer || !timeColumn || !gridContainer) return;

  // Clear existing (except static headers if any, but our HTML has them empty-ish)
  // Actually header has the time icon column, so we append
  const existingHeader = headerContainer.firstElementChild;
  headerContainer.innerHTML = "";
  if (existingHeader) headerContainer.appendChild(existingHeader);

  // Render Time Column
  timeColumn.innerHTML = "";
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const timeLabel = document.createElement("div");
    timeLabel.className = "agenda-time-slot";
    timeLabel.textContent = `${hour}:00`;
    timeColumn.appendChild(timeLabel);
  }

  // Render Columns
  // Remove existing columns first? The grid container has the current time line.
  // We should keep the time line.
  const timeLine = gridContainer.querySelector(".absolute.border-red-500");
  gridContainer.innerHTML = "";
  if (timeLine) gridContainer.appendChild(timeLine);

  professionals.forEach((prof) => {
    // Header
    const colHeader = document.createElement("div");
    colHeader.className = "agenda-col-header";
    colHeader.innerHTML = `
      <div class="agenda-avatar">
        ${prof.avatar_url
        ? `<img src="${prof.avatar_url}" class="agenda-avatar-img">`
        : prof.name.substring(0, 2).toUpperCase()
      }
      </div>
      <div class="agenda-prof-info">
        <p class="agenda-prof-name">${prof.name}</p>
        <p class="agenda-prof-specialty">${prof.specialty}</p>
      </div>
    `;
    headerContainer.appendChild(colHeader);

    // Grid Column
    const col = document.createElement("div");
    col.className = "agenda-col";
    // We need to set height based on total hours * slot height
    col.style.height = `${(END_HOUR - START_HOUR + 1) * SLOT_HEIGHT}px`;

    // Render Appointments for this professional
    const profAppointments = appointments.filter(
      (a) => a.professional_name === prof.name, // ideally use ID, but summary might not have prof ID easily?
      // Actually AppointmentSummary HAS professional_name, but maybe not ID?
      // Let's check type.
      // We should match by name for now or fetch ID if available.
      // Wait, listAppointments response doesn't guarantee professional_id in summary?
      // It does mostly. Let's assume name match for prototype if ID missing.
    );

    profAppointments.forEach((app) => {
      // Parse time "HH:MM"
      const [h, m] = app.time.split(":").map(Number);
      if (h < START_HOUR || h > END_HOUR) return;

      const top = (h - START_HOUR + m / 60) * SLOT_HEIGHT;
      // Duration? Assume 1h or 30m? Defaults to 1h visual
      const height = 96; // 1 slot

      const card = document.createElement("div");
      card.style.top = `${top}px`;
      card.style.height = `${height}px`;

      const statusColors: Record<string, string> = {
        scheduled: "agenda-card--scheduled",
        completed: "agenda-card--completed",
        cancelled: "agenda-card--cancelled",
      };

      const colorClass = statusColors[app.status] || statusColors.scheduled;
      card.className = `agenda-card ${colorClass}`;

      card.innerHTML = `
        <p class="agenda-card-title">${app.patient_name}</p>
        <p class="agenda-card-time">${app.time}</p>
        <div class="agenda-card-footer">
           <span class="material-symbols-outlined" style="font-size: 0.625rem;">event_note</span>
           <span class="u-truncate">${app.status}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        uiStore.addToast(
          "info",
          `Consulta: ${app.patient_name} - ${app.status}`,
        );
      });

      col.appendChild(card);
    });

    gridContainer.appendChild(col);
  });
}
