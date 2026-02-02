import "../../css/pages/reception-dashboard.css";
import { Navigation } from "../components/Navigation";
import { ToastContainer } from "../components/ToastContainer";
import {
  checkInAppointment,
  listAppointments,
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
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
 */

let toastContainer: ToastContainer | null = null;
let navigation: Navigation | null = null;

// State for pagination
let checkInPage = 1;
const checkInPageSize = 10;

async function initReceptionDashboard() {
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

  // Features
  setupNewAppointmentModal(session.clinic_id);
  setupGeneralAgendaModal(session.clinic_id);
  setupRescheduleModal();
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
  const scheduledToday = appointments.length;
  const awaitingCheckin = appointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "confirmed",
  ).length;
  const inProgress = appointments.filter(
    (apt) => apt.status === "in_progress",
  ).length;
  const noShow = appointments.filter((apt) => apt.status === "no_show").length;

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
  const upcomingAppointments = appointments.sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });

  const tbody = document.querySelector(".panel-card .table-body");
  if (!tbody) return;

  if (upcomingAppointments.length === 0) {
    tbody.innerHTML = `
      <tr class="table-row">
        <td colspan="6" class="table-empty-state">
          <div class="table-empty-content">
            <span class="material-symbols-outlined icon-medium">check_circle</span>
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
      // Relaxed check-in condition: also allow 'scheduled'
      const isReadyToCheckIn =
        apt.status === "confirmed" || apt.status === "scheduled";

      return `
      <tr class="table-row" data-appointment-id="${apt.id}">
        <td class="table-cell cell-patient-name">${apt.patient_name}</td>
        <td class="table-cell cell-time">
           <div class="checkin-time-container">
             <span class="checkin-time-date">${formatDate(apt.date)}</span>
             <span class="checkin-time-clock">${apt.time}</span>
           </div>
        </td>
        <td class="table-cell">${apt.professional_name}</td>
        <td class="table-cell">${statusBadge}</td>
        <td class="table-cell">
          <button
            class="btn-checkin ${isReadyToCheckIn ? "" : "btn-checkin-disabled"}"
            ${!isReadyToCheckIn ? "disabled" : ""}
            data-checkin-btn="${apt.id}"
          >
            CHECK-IN
          </button>
        </td>
        <td class="table-cell">
           <div class="action-buttons-container">
              <button class="action-icon-btn" title="Reagendar" data-reschedule-btn="${apt.id}">
                <span class="material-symbols-outlined action-icon-large">edit_calendar</span>
              </button>
              <button class="action-icon-btn u-text-error" title="Cancelar" data-cancel-btn="${apt.id}">
                <span class="material-symbols-outlined action-icon-large">cancel</span>
              </button>
           </div>
        </td>
      </tr>
    `;
    })
    .join("");

  setupCheckInButtons();
  setupActionButtons(tbody as HTMLElement);
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

function setupActionButtons(container: HTMLElement) {
  // Reschedule
  container.querySelectorAll("[data-reschedule-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-reschedule-btn");
      if (id) startRescheduleFlow(Number(id));
    });
  });

  // Cancel
  container.querySelectorAll("[data-cancel-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-cancel-btn");
      if (id) confirmCancellation(Number(id));
    });
  });
}

async function handleCheckIn(appointmentId: number) {
  const button = document.querySelector(
    `[data-checkin-btn="${appointmentId}"]`,
  ) as HTMLButtonElement | null;

  if (button) {
    button.disabled = true;
    button.textContent = "Processing...";
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
      button.textContent = "CHECK-IN";
    }
  }
}

// Action Flows
async function confirmCancellation(appointmentId: number) {
  if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
    try {
      const response = await cancelAppointment(appointmentId);
      if (response.success) {
        uiStore.addToast("success", "Agendamento cancelado com sucesso");
        await loadDashboardData();
        // Also refresh agenda modal if open, but simpler to just reload page data
      } else {
        uiStore.addToast(
          "error",
          response.error?.message || "Erro ao cancelar agendamento",
        );
      }
    } catch (err) {
      uiStore.addToast("error", "Erro ao cancelar agendamento");
    }
  }
}

// Reusing the new appointment modal for rescheduling would be complex due to different payload
// Creating a simpler prompt/modal for MVP
async function startRescheduleFlow(appointmentId: number) {
  const modal = document.getElementById("reschedule-appointment-modal");
  const form = document.getElementById(
    "reschedule-appointment-form",
  ) as HTMLFormElement;
  const appointmentIdInput = document.getElementById(
    "reschedule-appointment-id",
  ) as HTMLInputElement;
  const professionalIdInput = document.getElementById(
    "reschedule-professional-id",
  ) as HTMLInputElement;
  const patientNameEl = document.getElementById("reschedule-patient-name");
  const professionalNameEl = document.getElementById(
    "reschedule-professional-name",
  );
  const dateInput = document.getElementById(
    "reschedule-date-input",
  ) as HTMLInputElement;
  const timeInput = document.getElementById(
    "reschedule-time-input",
  ) as HTMLInputElement;

  if (!modal || !form) {
    console.error("Reschedule modal not found");
    return;
  }

  // Fetch appointment details to pre-fill content
  // We can find the appointment in the existing tables instead of fetching again
  // to save a request, or fetch fresh data. Let's fetch fresh data to be safe.
  // Actually, we need the professionalId which might not be in the summary fully if not displayed.
  // The summary has professional_id.

  // Let's try to find it in the DOM first to avoid loading state delay
  const row = document.querySelector(
    `tr[data-appointment-id="${appointmentId}"]`,
  );
  let professionalId = 0;
  let summary: any = {};

  // It's cleaner to fetch the single appointment to get all details securely
  try {
    const appointmentsFunc = await import("../services/appointmentsService");
    const getAppointmentResponse =
      await appointmentsFunc.getAppointment(appointmentId);

    if (getAppointmentResponse.success && getAppointmentResponse.data) {
      summary = getAppointmentResponse.data;
      professionalId = summary.professional_id;
    } else {
      uiStore.addToast("error", "Erro ao carregar dados do agendamento");
      return;
    }
  } catch (e) {
    console.error(e);
    uiStore.addToast("error", "Erro ao carregar dados do agendamento");
    return;
  }

  // Fill Modal
  appointmentIdInput.value = String(appointmentId);
  professionalIdInput.value = String(professionalId);
  if (patientNameEl) patientNameEl.textContent = summary.patient_name;
  if (professionalNameEl)
    professionalNameEl.textContent = `${summary.professional_name} - ${summary.specialty}`;

  // Reset inputs
  dateInput.value = "";
  timeInput.value = "";
  document.getElementById("reschedule-availability-slots")!.innerHTML = "";
  document
    .getElementById("reschedule-availability-section")!
    .classList.add("hidden");

  // Show Modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function setupRescheduleModal() {
  const modal = document.getElementById("reschedule-appointment-modal");
  const closeBtns = modal?.querySelectorAll(".close-modal-btn");
  const form = document.getElementById(
    "reschedule-appointment-form",
  ) as HTMLFormElement;
  const dateInput = document.getElementById(
    "reschedule-date-input",
  ) as HTMLInputElement;
  const timeInput = document.getElementById(
    "reschedule-time-input",
  ) as HTMLInputElement;
  const professionalIdInput = document.getElementById(
    "reschedule-professional-id",
  ) as HTMLInputElement;
  const availabilitySection = document.getElementById(
    "reschedule-availability-section",
  );
  const availabilitySlots = document.getElementById(
    "reschedule-availability-slots",
  );
  const availabilityMessage = document.getElementById(
    "reschedule-availability-message",
  );

  if (!modal) return;

  const toggleModal = (show: boolean) => {
    modal.classList.toggle("hidden", !show);
    modal.classList.toggle("flex", show);
  };

  closeBtns?.forEach((b) =>
    b.addEventListener("click", () => toggleModal(false)),
  );
  modal.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(false);
  });

  // Availability Logic (Similar to New Appointment)
  async function updateAvailability() {
    const professionalId = Number(professionalIdInput.value);
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
        btn.className = "slot-btn";
        btn.textContent = slot.time;

        btn.addEventListener("click", () => {
          availabilitySlots?.querySelectorAll("button").forEach((b) => {
            b.classList.remove("selected");
          });
          btn.classList.add("selected");
          timeInput.value = slot.time;
        });

        availabilitySlots?.appendChild(btn);
      });
    } else {
      if (availabilityMessage)
        availabilityMessage.textContent = "Erro ao carregar horários.";
    }
  }

  dateInput?.addEventListener("change", updateAvailability);

  // Form Submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const appointmentId = Number(formData.get("appointmentId"));
    const newDate = formData.get("newDate") as string;
    const newTime = formData.get("newTime") as string;

    if (!newDate || !newTime) {
      uiStore.addToast("warning", "Selecione data e horário");
      return;
    }

    uiStore.addToast("info", "Reagendando...");

    try {
      const response = await rescheduleAppointment(appointmentId, {
        newDate,
        newTime,
      });
      if (response.success) {
        uiStore.addToast("success", "Agendamento reagendado com sucesso");
        toggleModal(false);
        await loadDashboardData();
      } else {
        uiStore.addToast(
          "error",
          response.error?.message || "Erro ao reagendar",
        );
      }
    } catch (err) {
      uiStore.addToast("error", "Erro ao reagendar");
    }
  });
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-");
  return `${d}/${m}/${y}`;
}

function getStatusBadge(status: string): string {
  const badges: Record<string, { color: string; label: string }> = {
    scheduled: { color: "gray", label: "PENDENTE" },
    confirmed: { color: "blue", label: "CONFIRMADO" },
    waiting: { color: "amber", label: "AGUARDANDO" },
    in_progress: { color: "emerald", label: "EM ATENDIMENTO" },
    completed: { color: "emerald", label: "CONCLUÍDO" },
    cancelled: { color: "red", label: "CANCELADO" },
    cancelled_by_patient: { color: "red", label: "CANCELADO" },
    cancelled_by_clinic: { color: "red", label: "CANCELADO" },
    no_show: { color: "red", label: "AUSENTE" },
  };

  const badge = badges[status] || {
    color: "muted",
    label: status.toUpperCase(),
  };

  return `<span class="status-badge status-badge-${badge.color}">${badge.label}</span>`;
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
  const modal = document.getElementById("new-appointment-modal");
  const openBtn = document.getElementById("open-new-appointment-btn");
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
        '<div style="padding: 0.75rem; font-size: 0.875rem; color: var(--text-secondary);">Nenhum paciente encontrado</div>';
      return;
    }

    patients.forEach((p) => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `<p style="font-weight: 700; font-size: 0.875rem; margin: 0;">${p.name}</p><p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">${p.cpf || p.email}</p>`;
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
    if (professionalSelect.options.length > 1) return;
    const response = await listProfessionals({ pageSize: 100 });
    if (response.success && response.data) {
      const pros = response.data.data;
      professionalSelect.innerHTML =
        '<option value="">Selecione um profissional</option>';
      pros.forEach((p) => {
        const option = document.createElement("option");
        option.value = String(p.id);
        option.textContent = `${p.name} - ${p.specialty}`;
        option.dataset.price = String(p.consultation_price || 0);
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
  const priceInput = form.querySelector("input[name='price']") as HTMLInputElement;

  async function updateAvailability() {
    const professionalId = Number(professionalSelect.value);

    // Update Price
    if (professionalSelect.selectedOptions[0]) {
      const price = professionalSelect.selectedOptions[0].dataset.price;
      if (price && priceInput) {
        priceInput.value = price;
      }
    }
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
        btn.className = "slot-btn";
        btn.textContent = slot.time;

        btn.addEventListener("click", () => {
          availabilitySlots?.querySelectorAll("button").forEach((b) => {
            b.classList.remove("selected");
          });
          btn.classList.add("selected");
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
      type: "presencial",
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
      loadDashboardData();
    } else {
      uiStore.addToast(
        "error",
        response.error?.message || "Erro ao criar agendamento",
      );
    }
  });

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

/* --- General Agenda Modal Logic --- */
function setupGeneralAgendaModal(clinicId?: number) {
  const modal = document.getElementById("general-agenda-modal");
  const openBtn = document.getElementById("open-general-agenda-section-btn");
  const closeBtns = modal?.querySelectorAll(".close-modal-btn");

  const dateFilter = document.getElementById(
    "agenda-date-filter",
  ) as HTMLInputElement;
  const professionalFilter = document.getElementById(
    "agenda-professional-filter",
  ) as HTMLSelectElement;
  const refreshBtn = document.getElementById("refresh-agenda-btn");

  const tableBody = document.getElementById("agenda-table-body");
  const emptyState = document.getElementById("agenda-empty-state");
  const loadingState = document.getElementById("agenda-loading-state");

  if (!modal) return;

  if (dateFilter) {
    dateFilter.value = new Date().toISOString().split("T")[0];
  }

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

  async function loadAgenda() {
    if (loadingState) loadingState.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    if (tableBody) tableBody.innerHTML = "";

    const date = dateFilter?.value;
    const professionalId = professionalFilter?.value;

    const filters: any = { date, pageSize: 50 };
    if (professionalId) filters.professionalId = Number(professionalId);

    const response = await listAppointments(filters);

    if (loadingState) loadingState.classList.add("hidden");

    if (response.success && response.data) {
      const appts = response.data.appointments;

      if (appts.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }

      if (tableBody) {
        tableBody.innerHTML = appts
          .map(
            (apt) => `
                <tr class="table-row">
                    <td class="table-cell checkin-time-clock">${apt.time}</td>
                    <td class="table-cell cell-patient-name">${apt.patient_name}</td>
                    <td class="table-cell">${apt.professional_name}</td>
                    <td class="table-cell">${getStatusBadge(apt.status)}</td>
                    <td class="table-cell">
                        <div class="action-buttons-container">
                          <button class="action-icon-btn" title="Reagendar" data-reschedule-btn="${apt.id}">
                            <span class="material-symbols-outlined action-icon-large">edit_calendar</span>
                          </button>
                          <button class="action-icon-btn u-text-error" title="Cancelar" data-cancel-btn="${apt.id}">
                             <span class="material-symbols-outlined action-icon-large">cancel</span>
                          </button>
                       </div>
                    </td>
                </tr>
            `,
          )
          .join("");

        setupActionButtons(tableBody as HTMLElement);
      }
    }
  }

  refreshBtn?.addEventListener("click", loadAgenda);
  dateFilter?.addEventListener("change", loadAgenda);
  professionalFilter?.addEventListener("change", loadAgenda);
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReceptionDashboard);
} else {
  initReceptionDashboard();
}
