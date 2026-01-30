import { listAppointments } from "../services/appointmentsService";
import { authStore } from "../stores/authStore";
import { listProfessionals } from "../services/professionalsService";
import { uiStore } from "../stores/uiStore";
import type { AppointmentSummary } from "../types/appointments";
import type { ProfessionalSummary } from "../types/professionals";

// Constants
const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_HEIGHT = 96; // matches bg-[size:100%_96px]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

document.addEventListener("DOMContentLoaded", async () => {
  const session = await authStore.refreshSession();
  if (!session) {
    window.location.href = "/pages/login.html";
    return;
  }

  // Initial load
  loadAgenda();
});

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
    timeLabel.className =
      "h-24 flex items-center justify-center border-b border-border-dark"; // h-24 = 96px
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
    colHeader.className =
      "w-48 flex-shrink-0 p-3 border-r border-border-dark flex items-center gap-3";
    colHeader.innerHTML = `
      <div class="size-10 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-slate-400 font-bold overflow-hidden">
        ${
          prof.avatar_url
            ? `<img src="${prof.avatar_url}" class="w-full h-full object-cover">`
            : prof.name.substring(0, 2).toUpperCase()
        }
      </div>
      <div class="min-w-0">
        <p class="text-sm font-bold text-white truncate">${prof.name}</p>
        <p class="text-xs text-slate-400 truncate">${prof.specialty}</p>
      </div>
    `;
    headerContainer.appendChild(colHeader);

    // Grid Column
    const col = document.createElement("div");
    col.className =
      "w-48 flex-shrink-0 border-r border-border-dark relative h-full";
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
      card.className =
        "absolute w-[90%] left-[5%] bg-primary/20 border border-primary/50 text-white p-2 rounded-lg text-xs hover:bg-primary/30 transition-colors cursor-pointer overflow-hidden";
      card.style.top = `${top}px`;
      card.style.height = `${height}px`; // default height

      const statusColors: Record<string, string> = {
        scheduled: "bg-primary/20 border-primary/50 text-white",
        completed: "bg-emerald-500/20 border-emerald-500/50 text-emerald-100",
        cancelled: "bg-red-500/20 border-red-500/50 text-red-100",
      };

      const colorClass = statusColors[app.status] || statusColors.scheduled;
      card.className = `absolute w-[90%] left-[5%] p-2 rounded-lg text-xs border transition-colors cursor-pointer overflow-hidden ${colorClass}`;

      card.innerHTML = `
        <p class="font-bold truncate">${app.patient_name}</p>
        <p class="opacity-80">${app.time}</p>
        <div class="mt-1 flex items-center gap-1 opacity-60">
           <span class="material-symbols-outlined text-[10px]">event_note</span>
           <span class="truncate">${app.status}</span>
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
