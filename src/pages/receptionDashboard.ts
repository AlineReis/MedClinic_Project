import { Navigation } from "../components/Navigation";
import { ToastContainer } from "../components/ToastContainer";
import {
  checkInAppointment,
  listAppointments,
  createAppointment,
} from "../services/appointmentsService";
import { searchPatients } from "../services/patientService";
import {
  listProfessionals,
  getProfessionalAvailability,
} from "../services/professionalsService";
import { logout } from "../services/authService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";
import type { AppointmentSummary } from "../types/appointments";

/**
 * Reception Dashboard Page
 * Displays real-time appointment data for receptionists to manage check-ins and room assignments
 * Consumes GET /appointments with filters for status and date
 */

let toastContainer: ToastContainer | null = null;
let navigation: Navigation | null = null;

async function initReceptionDashboard() {
  // RBAC check: only receptionist, clinic_admin, and system_admin can access
  toastContainer = new ToastContainer();
  navigation = new Navigation();
  const session = await authStore.refreshSession();

  if (
    !session ||
    (session.role !== "receptionist" &&
      session.role !== "clinic_admin" &&
      session.role !== "system_admin")
  ) {
    window.location.href = "/pages/login.html";
    return;
  }

  setupUserProfile();
  setupLogoutButton();
  loadDashboardData();

  // New Features
  setupNewAppointmentModal(session.clinic_id);
  setupGeneralAgendaModal(session.clinic_id);
}

function setupUserProfile() {
  const session = authStore.getSession();
  if (!session) return;

  const userNameEl = document.querySelector("[data-user-name]");
  const userRoleEl = document.querySelectorAll("[data-user-role]");
  const userInitialsEl = document.querySelector("[data-user-initials]");

  if (userNameEl) {
    userNameEl.textContent = session.name;
  }

  userRoleEl.forEach((el) => {
    el.textContent = getRoleDisplay(session.role);
  });

  if (userInitialsEl) {
    const initials = session.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    userInitialsEl.textContent = initials;
  }
}

function setupLogoutButton() {
  const logoutBtn = document.querySelector("[data-logout-button]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
      authStore.clearSession();
      window.location.href = "/pages/login.html";
    });
  }
}

// State for pagination
let checkInPage = 1;
const checkInPageSize = 10;

async function loadDashboardData() {
  await loadStats();
  await loadUpcomingCheckIns();
}

async function loadStats() {
  const today = new Date().toISOString().split("T")[0];
  try {
    const statsResponse = await listAppointments({
      date: today,
      pageSize: 100,
    });

    if (statsResponse.success && statsResponse.data) {
      updateStatistics(statsResponse.data.appointments);
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function loadUpcomingCheckIns() {
  try {
    const response = await listAppointments({
      upcoming: true,
      page: checkInPage,
      pageSize: checkInPageSize,
    });

    if (response.success && response.data) {
      renderCheckInsTable(response.data.appointments);
      updatePaginationControls(response.data.appointments.length);
    }
  } catch (error) {
    console.error("Error loading upcoming checkins:", error);
  }
}

function updatePaginationControls(count: number) {
  const prevBtn = document.getElementById("prev-page-btn") as HTMLButtonElement;
  const nextBtn = document.getElementById("next-page-btn") as HTMLButtonElement;
  const pageSpan = document.getElementById("current-page-span");

  if (pageSpan) pageSpan.textContent = String(checkInPage);

  if (prevBtn) {
    prevBtn.disabled = checkInPage <= 1;
    prevBtn.onclick = () => {
      if (checkInPage > 1) {
        checkInPage--;
        loadUpcomingCheckIns();
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled = count < checkInPageSize;
    nextBtn.onclick = () => {
      checkInPage++;
      loadUpcomingCheckIns();
    };
  }
}

function updateStatistics(appointments: AppointmentSummary[]) {
  // Calculate statistics based on appointment status
  const scheduledToday = appointments.length;
  const awaitingCheckin = appointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "confirmed",
  ).length;
  const inProgress = appointments.filter(
    (apt) => apt.status === "in_progress",
  ).length;
  const noShow = appointments.filter((apt) => apt.status === "no_show").length;

  // Update stats cards (using direct DOM manipulation since HTML has hardcoded values)
  const statsCards = document.querySelectorAll("section")[0];
  if (statsCards) {
    const cards = statsCards.querySelectorAll("h3");
    if (cards[0]) cards[0].textContent = scheduledToday.toString();
    if (cards[1]) cards[1].textContent = awaitingCheckin.toString();
    if (cards[2]) cards[2].textContent = inProgress.toString();
    if (cards[3]) cards[3].textContent = noShow.toString();
  }
}

function renderCheckInsTable(appointments: AppointmentSummary[]) {
  // Sort by DATE and TIME
  const upcomingAppointments = appointments.sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });

  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  if (upcomingAppointments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-slate-400">
          <div class="flex flex-col items-center gap-2">
            <span class="material-symbols-outlined text-4xl">check_circle</span>
            <p>Nenhum check-in pendente no momento</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = upcomingAppointments
    .map((apt) => {
      const statusBadge = getStatusBadge(apt.status);
      const isReady = apt.status === "confirmed";

      return `
      <tr class="hover:bg-border-dark/10" data-appointment-id="${apt.id}">
        <td class="px-6 py-4 font-medium">${apt.patient_name}</td>
        <td class="px-6 py-4 text-slate-400">
           <span class="block text-xs text-slate-500">${formatDate(apt.date)}</span>
           <span class="font-bold text-white">${apt.time}</span>
        </td>
        <td class="px-6 py-4">${apt.professional_name}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4">
          <button
            class="px-3 py-1.5 ${
              isReady
                ? "bg-primary text-white"
                : "bg-border-dark text-slate-400"
            } text-[10px] font-bold rounded"
            data-checkin-btn="${apt.id}"
          >
            CHECK-IN
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Setup check-in button handlers
  setupCheckInButtons();
}

function setupCheckInButtons() {
  const buttons = document.querySelectorAll("[data-checkin-btn]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.target as HTMLButtonElement;
      const appointmentId = target.getAttribute("data-checkin-btn");

      if (appointmentId) {
        await handleCheckIn(Number(appointmentId));
      }
    });
  });
}

async function handleCheckIn(appointmentId: number) {
  const button = document.querySelector(
    `[data-checkin-btn="${appointmentId}"]`,
  ) as HTMLButtonElement | null;

  if (button) {
    button.disabled = true;
    button.classList.add("opacity-50", "cursor-wait");
  }

  try {
    const response = await checkInAppointment(appointmentId);

    if (response.success) {
      uiStore.addToast("success", "Check-in realizado com sucesso");
      await loadDashboardData();
    } else {
      uiStore.addToast(
        "error",
        response.error?.message || "Não foi possível confirmar o check-in.",
      );
    }
  } catch (error) {
    console.error("Erro ao confirmar check-in:", error);
    uiStore.addToast(
      "error",
      "Erro de comunicação ao confirmar o check-in. Tente novamente.",
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove("opacity-50", "cursor-wait");
    }
  }
}

function getStatusBadge(status: string): string {
  const badges: Record<string, { color: string; label: string }> = {
    scheduled: { color: "slate", label: "PENDENTE" },
    confirmed: { color: "amber", label: "AGUARDANDO" },
    in_progress: { color: "emerald", label: "EM ATENDIMENTO" },
    completed: { color: "blue", label: "CONCLUÍDO" },
    cancelled_by_patient: { color: "red", label: "CANCELADO" },
    cancelled_by_clinic: { color: "red", label: "CANCELADO" },
    no_show: { color: "red", label: "AUSENTE" },
  };

  const badge = badges[status] || {
    color: "slate",
    label: status.toUpperCase(),
  };

  return `<span class="px-2 py-0.5 rounded bg-${badge.color}-500/10 text-${badge.color}-500 text-[10px] font-bold">${badge.label}</span>`;
}

function getRoleDisplay(role: string): string {
  const roles: Record<string, string> = {
    patient: "Paciente",
    receptionist: "Recepcionista",
    lab_tech: "Técnico de Laboratório",
    health_professional: "Profissional de Saúde",
    clinic_admin: "Administrador",
    system_admin: "Administrador do Sistema",
  };
  return roles[role] || role;
}

/* --- New Appointment Modal Logic --- */
function setupNewAppointmentModal(clinicId?: number) {
  // We need clinicId context if searching professionals by clinic.
  // Actually listProfessionals usually gets current user's clinic or all if admin?
  // listProfessionals logic: uses api.get("/professionals") - check implementation

  const modal = document.getElementById("new-appointment-modal");

  // Create a trigger button dynamically in the actions area if not present, OR bind to an existing one.
  // For now let's assume we want to trigger it from a new button we inject or the user can add.
  // I added a "Novo Agendamento" button in HTML?? NO! I forgot to add the button in HTML in previous step!
  // I will inject the button via JS into the header for now or expect it to be there.
  // "Próximos Check-ins" section header has a "Ver Todos" button.
  // Let's add an "Agendar" button near "Agendados Hoje" or in the Header.
  // Let's create a Floating Action Button or put it in the header via JS for now.

  let openBtn = document.getElementById("open-new-appointment-btn");
  if (!openBtn) {
    // Inject button in the header actions area
    const headerActions = document.querySelector(
      "header .flex.items-center.gap-4",
    );
    if (headerActions) {
      openBtn = document.createElement("button");
      openBtn.id = "open-new-appointment-btn";
      openBtn.className =
        "hidden md:flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors";
      openBtn.innerHTML =
        '<span class="material-symbols-outlined text-sm">add</span> Agendar';
      headerActions.prepend(openBtn);
    }
  }

  const closeBtns = modal?.querySelectorAll(".close-modal-btn");
  const form = document.getElementById(
    "new-appointment-form",
  ) as HTMLFormElement;
  const patientSearchInput = document.getElementById(
    "patient-search",
  ) as HTMLInputElement;
  const patientSearchResults = document.getElementById(
    "patient-search-results",
  );
  const selectedPatientId = document.getElementById(
    "selected-patient-id",
  ) as HTMLInputElement;
  const professionalSelect = document.getElementById(
    "professional-select",
  ) as HTMLSelectElement;

  if (!modal) return;

  const toggleModal = (show: boolean) => {
    modal.classList.toggle("hidden", !show);
    modal.classList.toggle("flex", show);
    if (show) {
      loadProfessionals();
    }
  };

  openBtn?.addEventListener("click", () => toggleModal(true));
  closeBtns?.forEach((b) =>
    b.addEventListener("click", () => toggleModal(false)),
  );
  modal.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(false);
  });

  // Patient Search Logic
  let searchTimeout: any;
  patientSearchInput?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const query = patientSearchInput.value.trim();

    if (query.length < 2) {
      if (patientSearchResults) patientSearchResults.classList.add("hidden");
      return;
    }

    searchTimeout = setTimeout(async () => {
      const response = await searchPatients(query);
      if (response.success && response.data && patientSearchResults) {
        renderPatientResults(response.data);
      }
    }, 500);
  });

  function renderPatientResults(patients: any[]) {
    if (!patientSearchResults) return;

    patientSearchResults.innerHTML = "";
    patientSearchResults.classList.remove("hidden");

    if (patients.length === 0) {
      patientSearchResults.innerHTML =
        '<div class="p-3 text-sm text-slate-500">Nenhum paciente encontrado</div>';
      return;
    }

    patients.forEach((p) => {
      const div = document.createElement("div");
      div.className =
        "p-3 hover:bg-background-dark cursor-pointer border-b border-border-dark last:border-0";
      div.innerHTML = `<p class="font-bold text-sm">${p.name}</p><p class="text-xs text-slate-400">${p.cpf || p.email}</p>`;
      div.addEventListener("click", () => {
        patientSearchInput.value = p.name;
        selectedPatientId.value = p.id;
        patientSearchResults.classList.add("hidden");
      });
      patientSearchResults.appendChild(div);
    });
  }

  // Load Professionals
  async function loadProfessionals() {
    if (professionalSelect.options.length > 1) return; // Already loaded

    const response = await listProfessionals({ pageSize: 100 });
    if (response.success && response.data) {
      const pros = response.data.data;
      professionalSelect.innerHTML =
        '<option value="">Selecione um profissional</option>';
      pros.forEach((p) => {
        const option = document.createElement("option");
        option.value = String(p.id);
        option.textContent = `${p.name} - ${p.specialty}`;
        professionalSelect.appendChild(option);
      });
    }
  }

  // Availability Logic
  const dateInput = form.querySelector(
    "input[name='date']",
  ) as HTMLInputElement;
  const timeInput = form.querySelector(
    "input[name='time']",
  ) as HTMLInputElement;
  const availabilitySection = document.getElementById("availability-section");
  const availabilitySlots = document.getElementById("availability-slots");
  const availabilityMessage = document.getElementById("availability-message");

  async function updateAvailability() {
    const professionalId = Number(professionalSelect.value);
    const date = dateInput.value;

    if (!professionalId || !date) {
      if (availabilitySection) availabilitySection.classList.add("hidden");
      return;
    }

    if (availabilitySection) availabilitySection.classList.remove("hidden");
    if (availabilityMessage) {
      availabilityMessage.textContent = "Carregando horários...";
      availabilityMessage.classList.remove("hidden");
    }
    if (availabilitySlots) availabilitySlots.innerHTML = "";

    const response = await getProfessionalAvailability(professionalId, {
      startDate: date,
      endDate: date,
    });

    if (response.success && response.data) {
      // Backend returns 50min slots in data
      const slots = response.data.filter((s: any) => s.is_available);

      if (slots.length === 0) {
        if (availabilityMessage)
          availabilityMessage.textContent =
            "Nenhum horário disponível nesta data.";
        return;
      }

      if (availabilityMessage) availabilityMessage.classList.add("hidden");

      slots.forEach((slot: any) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "px-3 py-2 rounded-lg bg-border-dark hover:bg-primary hover:text-white text-sm font-medium transition-colors border border-border-dark";
        btn.textContent = slot.time;

        btn.addEventListener("click", () => {
          // Select query
          availabilitySlots?.querySelectorAll("button").forEach((b) => {
            b.classList.remove(
              "bg-primary",
              "text-white",
              "ring-2",
              "ring-offset-1",
            );
            b.classList.add("bg-border-dark");
          });
          btn.classList.remove("bg-border-dark");
          btn.classList.add(
            "bg-primary",
            "text-white",
            "ring-2",
            "ring-offset-1",
          ); // Visual selection

          timeInput.value = slot.time;
        });

        availabilitySlots?.appendChild(btn);
      });
    } else {
      if (availabilityMessage)
        availabilityMessage.textContent = "Erro ao carregar horários.";
    }
  }

  professionalSelect.addEventListener("change", updateAvailability);
  dateInput.addEventListener("change", updateAvailability);

  // Form Submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const payload = {
      patientId: Number(formData.get("patientId")),
      professionalId: Number(formData.get("professionalId")),
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      type: formData.get("type") as string,
      price: Number(formData.get("price")) || 0,
    };

    if (!payload.patientId) {
      uiStore.addToast("warning", "Selecione um paciente");
      return;
    }

    uiStore.addToast("info", "Criando agendamento...");
    const response = await createAppointment(payload);

    if (response.success) {
      uiStore.addToast("success", "Agendamento criado com sucesso!");
      toggleModal(false);
      form.reset();
      loadDashboardData(); // Refresh dashboard
    } else {
      uiStore.addToast(
        "error",
        response.error?.message || "Erro ao criar agendamento",
      );
    }
  });

  // Hide search results safely
  document.addEventListener("click", (e) => {
    if (
      patientSearchResults &&
      !patientSearchInput.contains(e.target as Node) &&
      !patientSearchResults.contains(e.target as Node)
    ) {
      patientSearchResults.classList.add("hidden");
    }
  });
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-");
  return `${d}/${m}/${y}`;
}

/* --- General Agenda Modal Logic --- */
function setupGeneralAgendaModal(clinicId?: number) {
  const modal = document.getElementById("general-agenda-modal");
  const openBtn = document.getElementById("open-general-agenda-section-btn");
  const closeBtns = modal?.querySelectorAll(".close-modal-btn");

  // Filters
  const dateFilter = document.getElementById(
    "agenda-date-filter",
  ) as HTMLInputElement;
  const professionalFilter = document.getElementById(
    "agenda-professional-filter",
  ) as HTMLSelectElement;
  const refreshBtn = document.getElementById("refresh-agenda-btn");

  // Content
  const tableBody = document.getElementById("agenda-table-body");
  const emptyState = document.getElementById("agenda-empty-state");
  const loadingState = document.getElementById("agenda-loading-state");

  if (!modal) return;

  // Set default date to today
  if (dateFilter) {
    dateFilter.value = new Date().toISOString().split("T")[0];
  }

  // Toggle Modal
  const toggleModal = async (show: boolean) => {
    modal.classList.toggle("hidden", !show);
    modal.classList.toggle("flex", show);
    if (show) {
      await loadProfessionalsFilter();
      await loadAgenda();
    }
  };

  openBtn?.addEventListener("click", () => toggleModal(true));
  closeBtns?.forEach((b) =>
    b.addEventListener("click", () => toggleModal(false)),
  );
  modal.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(false);
  });

  // Load Professionals Filter
  async function loadProfessionalsFilter() {
    if (professionalFilter && professionalFilter.options.length <= 1) {
      const response = await listProfessionals({ pageSize: 100 });
      if (response.success && response.data) {
        response.data.data.forEach((p) => {
          const option = document.createElement("option");
          option.value = String(p.id);
          option.textContent = p.name;
          professionalFilter.appendChild(option);
        });
      }
    }
  }

  // Load Agenda Data
  async function loadAgenda() {
    if (!tableBody || !dateFilter) return;

    // Show Loading
    tableBody.innerHTML = "";
    emptyState?.classList.add("hidden");
    loadingState?.classList.remove("hidden");

    try {
      const response = await listAppointments({
        date: dateFilter.value,
        professionalId: professionalFilter.value
          ? Number(professionalFilter.value)
          : undefined,
        pageSize: 100,
      });

      loadingState?.classList.add("hidden");

      if (response.success && response.data) {
        const appointments = response.data.appointments;

        if (appointments.length === 0) {
          emptyState?.classList.remove("hidden");
          return;
        }

        // Sort by time
        appointments.sort((a, b) => a.time.localeCompare(b.time));

        tableBody.innerHTML = appointments
          .map(
            (apt) => `
                    <tr class="hover:bg-border-dark/10 border-b border-border-dark last:border-0" data-appointment-id="${apt.id}">
                        <td class="px-4 py-3 font-medium text-white">${apt.time}</td>
                        <td class="px-4 py-3 text-slate-300 font-bold">${apt.patient_name}</td>
                        <td class="px-4 py-3 text-slate-400">${apt.professional_name}</td>
                        <td class="px-4 py-3">${getStatusBadge(apt.status)}</td>
                         <td class="px-4 py-3">
                            ${getActionButtons(apt)}
                        </td>
                    </tr>
                `,
          )
          .join("");

        // Bind action buttons
        tableBody.querySelectorAll("[data-checkin-btn]").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const target = e.target as HTMLButtonElement;
            const id = Number(target.getAttribute("data-checkin-btn"));
            await handleCheckIn(id); // Reusing existing handleCheckIn
            await loadAgenda(); // Reload list
          });
        });
      } else {
        uiStore.addToast("error", "Erro ao carregar agenda.");
        emptyState?.classList.remove("hidden");
      }
    } catch (err) {
      console.error(err);
      loadingState?.classList.add("hidden");
      uiStore.addToast("error", "Erro crítico ao carregar agenda.");
    }
  }

  refreshBtn?.addEventListener("click", loadAgenda);
  dateFilter?.addEventListener("change", loadAgenda);
  professionalFilter?.addEventListener("change", loadAgenda);
}

function getActionButtons(apt: AppointmentSummary) {
  if (apt.status === "scheduled" || apt.status === "confirmed") {
    return `<button class="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors" data-checkin-btn="${apt.id}">Check-in</button>`;
  }
  return `<button class="text-xs text-slate-500 cursor-default" disabled>---</button>`;
}

// Initialize on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReceptionDashboard);
} else {
  initReceptionDashboard();
}
