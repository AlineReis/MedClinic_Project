import "../../css/pages/doctor-dashboard.css"
import { Navigation } from "../components/Navigation";
import { MobileSidebar } from "../components/MobileSidebar";
import { ToastContainer } from "../components/ToastContainer";
import { listAppointments } from "../services/appointmentsService";
import { createExam, listCatalog } from "../services/examsService";
import {
  createPrescription,
  listPrescriptions,
} from "../services/prescriptionsService";
import {
  createProfessionalAvailability,
  deleteAvailability,
  getProfessionalAvailability,
  getProfessionalAvailabilityRules,
  getProfessionalCommissions,
} from "../services/professionalsService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";
import type { AppointmentSummary } from "../types/appointments";
import type { CreateExamPayload } from "../types/exams";
import type {
  CreatePrescriptionPayload,
  PrescriptionSummary,
} from "../types/prescriptions";
import type {
  AvailabilityInput,
  CommissionsResponse,
} from "../types/professionals";

const MAX_AUTOCOMPLETE_RESULTS = 6;
let appointmentAutocompleteCache: AppointmentSummary[] = [];

async function initDoctorDashboard() {
  const session = await authStore.refreshSession();

  if (!session || session.role !== "health_professional") {
    uiStore.addToast(
      "error",
      "Acesso negado. Apenas profissionais de saúde podem acessar esta página.",
    );
    window.location.href = "/pages/login.html";
    return;
  }

  // Initialize UI Components
  new Navigation();
  new MobileSidebar();
  new ToastContainer();

  populateCommissionMonthOptions();

  // Load upcoming appointments
  await loadUpcomingAppointments(session.id);

  // Load commissions data for current month
  const currentMonth = new Date().getMonth() + 1;
  await loadCommissions(session.id, currentMonth);

  // Setup commission filter listeners
  setupCommissionFilters(session.id);

  // Load recent prescriptions
  await loadPrescriptions(session.id);

  // Setup availability management
  setupAvailabilityManagement(session.id);

  // Setup exam request
  setupExamRequest(session.id);

  // Setup prescription creation
  setupPrescriptionCreation(session.id);

  // Setup agenda modal
  setupAgendaModal(session.id);
}

async function loadUpcomingAppointments(professionalId: number) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Get today's appointments
    const todayResponse = await listAppointments({
      professionalId,
      date: todayStr,
      status: "scheduled,confirmed",
    });

    // Get all upcoming appointments
    const upcomingResponse = await listAppointments({
      professionalId,
      upcoming: true,
    });

    if (
      todayResponse.success &&
      upcomingResponse.success &&
      todayResponse.data &&
      upcomingResponse.data
    ) {
      const todayAppointments = todayResponse.data.appointments;
      const allUpcoming = upcomingResponse.data.appointments;

      appointmentAutocompleteCache = dedupeAppointments([
        ...todayAppointments,
        ...allUpcoming,
      ]);
      updateStats(todayAppointments, allUpcoming);
      updateNextPatient(todayAppointments);
      updateWaitingQueue(todayAppointments);
    } else {
      uiStore.addToast("error", "Erro ao carregar agendamentos");
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
    uiStore.addToast("error", "Erro ao carregar agendamentos");
  }
}

function updateStats(
  todayAppointments: AppointmentSummary[],
  allUpcoming: AppointmentSummary[],
) {
  // Count today's appointments
  const totalToday = todayAppointments.length;

  // Count appointments by status
  const waiting = todayAppointments.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed",
  ).length;
  const completed = todayAppointments.filter(
    (a) => a.status === "completed",
  ).length;

  // Update stat cards
  const statsCards = document.querySelectorAll("section.grid h3");
  if (statsCards[0]) statsCards[0].textContent = String(totalToday);
  if (statsCards[1]) statsCards[1].textContent = String(waiting);
  if (statsCards[2]) statsCards[2].textContent = String(completed);
}

function updateNextPatient(appointments: AppointmentSummary[]) {
  if (appointments.length === 0) {
    // Show empty state
    const nextPatientCard = document.querySelector(".next-patient-card");
    if (nextPatientCard) {
      nextPatientCard.innerHTML = `
        <div class="u-text-center u-padding-medium">
          <span class="material-symbols-outlined u-text-secondary u-opacity-60" style="font-size: 4rem;">event_available</span>
          <p class="u-mt-10 u-fs-lg">Nenhum paciente agendado para hoje</p>
        </div>
      `
    }
    return;
  }

  // Sort by time and get the next one
  const sortedAppointments = [...appointments].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const nextAppointment = sortedAppointments[0];
  const nextPatientCard = document.querySelector(".next-patient-card");

  if (nextPatientCard) {
    nextPatientCard.innerHTML = `
      <span class="badge badge--primary u-mb-10">Próximo Paciente</span>
      <div class="u-mb-15">
        <h3 class="u-fs-xl u-fw-700">${nextAppointment.patient_name || "Paciente"}</h3>
        <p class="u-text-secondary">Consulta • ${nextAppointment.specialty || "Profissional"}</p>
      </div>
      
      <div class="u-flex u-gap-medium u-mb-20">
        <span class="u-flex u-items-center u-gap-small u-text-secondary">
          <span class="material-symbols-outlined u-fs-sm">schedule</span> ${nextAppointment.time}
        </span>
        ${nextAppointment.room
        ? `
          <span class="u-flex u-items-center u-gap-small u-text-secondary">
            <span class="material-symbols-outlined u-fs-sm">location_on</span> Sala ${nextAppointment.room}
          </span>
        `
        : ""
      }
      </div>
      
      <button onclick="window.location.href='pep.html'" class="btn btn--primary btn--block">
        Iniciar Atendimento
      </button>
    `
  }
}

function updateWaitingQueue(appointments: AppointmentSummary[]) {
  const queueList = document.querySelector(".bg-surface-dark ul");
  if (!queueList) return;

  // Filter appointments that are waiting (after the first one)
  const sortedAppointments = [...appointments]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(1, 5); // Show next 4 appointments

  if (sortedAppointments.length === 0) {
    queueList.innerHTML = `
      <li class="list-item-row u-justify-between u-items-center">
        <span class="u-text-secondary u-fs-sm">Nenhum paciente na fila</span>
      </li>
    `
    return
  }

  queueList.innerHTML = sortedAppointments
    .map(
      (appointment) => `
      <li class="list-item-row u-justify-between u-items-center">
        <span class="u-fw-600">${appointment.patient_name || "Paciente"}</span>
        <span class="badge ${appointment.status === "confirmed" ? "badge--warning" : "badge--neutral"}">
          ${appointment.time}
        </span>
      </li>
    `,
    )
    .join("")
}

function dedupeAppointments(appointments: AppointmentSummary[]) {
  const seen = new Map<number, AppointmentSummary>();
  appointments.forEach((appointment) => {
    if (!appointment.id) return;
    if (!seen.has(appointment.id)) {
      seen.set(appointment.id, appointment);
    }
  });
  return Array.from(seen.values());
}

async function loadCommissions(
  professionalId: number,
  month?: number,
  status?: "pending" | "paid",
) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    const response = await getProfessionalCommissions(professionalId, {
      month,
      year: currentYear,
      status,
    });

    if (response.success && response.data) {
      updateCommissionsPanel(response.data);
    } else {
      console.error("Failed to load commissions:", response.error);
    }
  } catch (error) {
    console.error("Error loading commissions:", error);
  }
}

function setupCommissionFilters(professionalId: number) {
  const monthFilter = document.getElementById(
    "commissions-month-filter",
  ) as HTMLSelectElement;
  const statusFilter = document.getElementById(
    "commissions-status-filter",
  ) as HTMLSelectElement;

  if (!monthFilter || !statusFilter) return;

  // Set current month as default
  const currentMonth = new Date().getMonth() + 1;
  monthFilter.value = String(currentMonth);

  const handleFilterChange = () => {
    const month = monthFilter.value ? Number(monthFilter.value) : undefined;
    const status = statusFilter.value
      ? (statusFilter.value as "pending" | "paid")
      : undefined;
    loadCommissions(professionalId, month, status);
  };

  monthFilter.addEventListener("change", handleFilterChange);
  statusFilter.addEventListener("change", handleFilterChange);
}

function populateCommissionMonthOptions() {
  const monthFilter = document.getElementById(
    "commissions-month-filter",
  ) as HTMLSelectElement | null;

  if (!monthFilter) return;

  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });
  const options = [
    "",
    ...Array.from({ length: 12 }, (_, index) => String(index + 1)),
  ];

  monthFilter.innerHTML = options
    .map((value) => {
      if (value === "") {
        return `<option value="">Selecione um mês</option>`;
      }
      const monthName = formatter.format(new Date(2000, Number(value) - 1, 1));
      return `<option value="${value}">${monthName}</option>`;
    })
    .join("");
}

function updateCommissionsPanel(data: CommissionsResponse) {
  const totalElement = document.querySelector("[data-commission-total]");
  const pendingElement = document.querySelector("[data-commission-pending]");
  const paidElement = document.querySelector("[data-commission-paid]");
  const detailsSection = document.querySelector("[data-commissions-details]");

  if (!totalElement || !pendingElement || !paidElement || !detailsSection)
    return;

  const { summary, details } = data;

  // Update summary values using data attributes
  totalElement.textContent = `R$ ${formatCurrency(summary.total)}`;
  pendingElement.textContent = `R$ ${formatCurrency(summary.pending)}`;
  paidElement.textContent = `R$ ${formatCurrency(summary.paid)}`;

  // Update details list
  if (details.length === 0) {
    detailsSection.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-sm">
        Nenhuma comissão encontrada
      </div>
    `;
    return;
  }

  // Render all commission details (the container has max-height with scroll)
  detailsSection.innerHTML = details
    .map(
      (commission) => `
    <div class="list-item-row">
      <div class="list-item-main">
        <p class="list-item-title">Consulta #${commission.appointment_id}</p>
        <p class="list-item-subtitle">${formatDate(commission.created_at)}</p>
      </div>
      <div class="list-item-meta">
        <p class="list-item-value">R$ ${formatCurrency(commission.amount)}</p>
        <span class="status-badge ${commission.status === "paid" ? "status-badge--paid" : "status-badge--pending"}">
          ${commission.status === "paid" ? "Pago" : "Pendente"}
        </span>
      </div>
    </div>
  `,
    )
    .join("");
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function loadPrescriptions(professionalId: number) {
  try {
    const response = await listPrescriptions({ professionalId });

    if (response.success && response.data) {
      updatePrescriptionsPanel(response.data);
    } else {
      console.error("Failed to load prescriptions:", response.error);
    }
  } catch (error) {
    console.error("Error loading prescriptions:", error);
  }
}

function updatePrescriptionsPanel(prescriptions: PrescriptionSummary[]) {
  const prescriptionsSection = document.querySelector(
    "[data-prescriptions-list]",
  );

  if (!prescriptionsSection) return;

  if (prescriptions.length === 0) {
    prescriptionsSection.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-sm">
        Nenhuma prescrição encontrada
      </div>
    `;
    return;
  }

  // Display the 5 most recent prescriptions
  prescriptionsSection.innerHTML = prescriptions
    .slice(0, 5)
    .map(
      (prescription) => `
    <div class="list-item-row">
      <div class="list-item-main">
        <p class="list-item-title">${prescription.medication_name}</p>
        <p class="list-item-subtitle">${formatDate(prescription.created_at)}</p>
        ${prescription.dosage ? `<p class="list-item-subtitle" style="margin-top: 0.25rem;">${prescription.dosage}</p>` : ""}
      </div>
      <div class="list-item-meta">
        ${prescription.quantity ? `<p class="list-item-value">${prescription.quantity}x</p>` : ""}
      </div>
    </div>
  `,
    )
    .join("");
}

function setupAvailabilityManagement(professionalId: number) {
  const addButton = document.getElementById("add-availability-button");
  if (!addButton) return;

  addButton.addEventListener("click", () =>
    showAvailabilityModal(professionalId),
  );
}

function showAvailabilityModal(professionalId: number) {
  const modal = document.createElement("div");
  modal.className = "modal modal--open";
  modal.style.zIndex = "9999";
  modal.innerHTML = `
    <div class="modal__dialog">
      <div class="modal__header">
        <h3 class="modal__title">Gerenciar Disponibilidade</h3>
        <button id="close-availability-modal" class="modal__close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal__body" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Existing Slots Section -->
        <div>
          <h4 class="u-fs-sm u-fw-600 u-mb-10">Horários Cadastrados</h4>
          <div id="existing-availability-list" class="custom-scrollbar" style="max-height: 200px; overflow-y: auto;">
             <p class="u-text-secondary u-text-center" style="padding: 1rem;">Carregando horários...</p>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-dark); padding-top: 1rem;">
          <h4 class="u-fs-sm u-fw-600 u-mb-10">Adicionar Novos Horários</h4>
          <div id="availability-entries" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form">
              <div class="form__group" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                <div>
                  <label class="form__label">Dia da Semana</label>
                  <select class="select day-select">
                    <option value="0">Domingo</option>
                    <option value="1" selected>Segunda</option>
                    <option value="2">Terça</option>
                    <option value="3">Quarta</option>
                    <option value="4">Quinta</option>
                    <option value="5">Sexta</option>
                    <option value="6">Sábado</option>
                  </select>
                </div>
                <div>
                  <label class="form__label">Início</label>
                  <input type="time" class="input start-time" value="09:00" />
                </div>
                <div>
                  <label class="form__label">Fim</label>
                  <input type="time" class="input end-time" value="12:00" />
                </div>
                <div>
                  <button class="btn btn--danger btn--icon remove-entry" style="margin-bottom: 2px;">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button id="add-more-entry" class="btn btn--secondary btn--sm u-mt-10">
            <span class="material-symbols-outlined">add</span> Adicionar Mais Horário
          </button>
        </div>

        <div class="modal__footer">
          <button id="cancel-availability" class="btn btn--outline">
            Fechar
          </button>
          <button id="save-availability" class="btn btn--primary">
            Salvar Novos
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Load existing availability
  const loadExisting = async () => {
    const listContainer = modal.querySelector("#existing-availability-list");
    if (!listContainer) return;

    try {
      const response = await getProfessionalAvailabilityRules(professionalId);

      if (response.success && response.data && response.data.length > 0) {
        listContainer.innerHTML = response.data
          .map((rule: any) => {
            const days = [
              "Domingo",
              "Segunda",
              "Terça",
              "Quarta",
              "Quinta",
              "Sexta",
              "Sábado",
            ];
            return `
            <div class="list-item-row" style="align-items: center; justify-content: space-between;">
              <div>
                <span class="u-fw-700">${days[rule.day_of_week]}</span>
                <span class="u-text-secondary" style="margin: 0 0.5rem;">•</span>
                <span style="font-family: monospace; font-size: 0.875rem;">
                  ${rule.start_time.slice(0, 5)} - ${rule.end_time.slice(0, 5)}
                </span>
              </div>
              <button class="btn btn--text btn--danger btn--icon delete-rule-btn" data-id="${rule.id}">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          `;
          })
          .join("");

        // Attach delete handlers
        listContainer.querySelectorAll(".delete-rule-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const ruleId = Number((e.currentTarget as HTMLElement).dataset.id);
            if (!ruleId) return;

            if (confirm("Tem certeza que deseja remover este horário?")) {
              try {
                const delResponse = await deleteAvailability(
                  professionalId,
                  ruleId,
                );
                if (delResponse.success) {
                  uiStore.addToast("success", "Horário removido com sucesso");
                  loadExisting(); // Reload list
                } else {
                  uiStore.addToast("error", "Erro ao remover horário");
                }
              } catch (err) {
                console.error(err);
                uiStore.addToast("error", "Erro ao remover horário");
              }
            }
          });
        });
      } else {
        listContainer.innerHTML = `
          <div class="u-text-center" style="padding: 1.5rem 0;">
            <span class="material-symbols-outlined" style="font-size: 1.5rem; opacity: 0.5;">event_busy</span>
            <p style="font-size: 0.875rem;">Nenhum horário cadastrado</p>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      listContainer.innerHTML =
        '<p style="text-align: center; color: #f87171; padding: 1rem; font-size: 0.875rem;">Erro ao carregar horários</p>';
    }
  };

  loadExisting();

  /* Autocomplete / Search Variables */
  let searchInput: HTMLInputElement | null = null;
  let searchResultsContainer: HTMLDivElement | null = null;
  let hiddenAppointmentInput: HTMLInputElement | null = null;
  let hiddenPatientInput: HTMLInputElement | null = null;
  let selectedPatientLabel: HTMLElement | null = null;
  let searchTimeout: any = null;

  // Initialize elements
  searchInput = modal.querySelector("#patient-search-input");
  searchResultsContainer = modal.querySelector("#patient-search-results");
  hiddenAppointmentInput = modal.querySelector("#prescription-appointment-id");
  hiddenPatientInput = modal.querySelector("#prescription-patient-id");
  selectedPatientLabel = modal.querySelector("#selected-patient-label");

  const renderMessage = (message: string) => {
    if (!searchResultsContainer) return;
    searchResultsContainer.innerHTML = `<p class="text-xs text-slate-500">${message}</p>`;
  };

  const doSearch = async () => {
    if (!searchInput || !searchResultsContainer) return;

    const query = searchInput.value.trim().toLowerCase();
    if (query.length === 0) {
      renderMessage("Digite o nome do paciente acima");
      return;
    }

    renderMessage("Buscando pacientes...");
    await ensureAppointmentCache();

    const results = appointmentAutocompleteCache
      .filter((appointment) =>
        (appointment.patient_name ?? "").toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time ?? "").localeCompare(b.time ?? "");
      })
      .slice(0, MAX_AUTOCOMPLETE_RESULTS);

    renderPatientSearchResults(results, searchResultsContainer, query);
  };

  if (searchInput && searchResultsContainer) {
    searchInput.addEventListener("input", () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
      searchTimeout = window.setTimeout(doSearch, 250);
    });
    searchInput.addEventListener("focus", () => {
      if (!searchInput.value.trim()) {
        renderMessage("Digite o nome do paciente acima");
      }
    });
  }

  void ensureAppointmentCache();

  async function ensureAppointmentCache() {
    if (appointmentAutocompleteCache.length > 0) return;

    try {
      const response = await listAppointments({
        professionalId,
        upcoming: true,
        pageSize: 200,
      });

      if (response.success && response.data) {
        appointmentAutocompleteCache = dedupeAppointments(
          response.data.appointments,
        );
      }
    } catch (error) {
      console.error("Error loading appointments for search:", error);
      uiStore.addToast("error", "Não foi possível buscar pacientes no momento");
    }
  }

  function renderPatientSearchResults(
    results: AppointmentSummary[],
    container: HTMLElement,
    query: string,
  ) {
    container.innerHTML = "";

    if (results.length === 0) {
      renderMessage("Nenhum paciente encontrado");
      return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach((appointment) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "w-full text-left px-3 py-2 rounded-lg hover:bg-background-dark/80 bg-background-dark/30 transition-colors flex flex-col gap-1";
      const patientName = appointment.patient_name || "Paciente";
      button.innerHTML = `
        <span class="font-semibold text-white">${highlightMatch(
        patientName,
        query,
      )}</span>
        <span class="text-xs text-slate-400">
          ${appointment.date} • ${appointment.time}
        </span>
      `;
      button.addEventListener("click", () => {
        selectAppointment(appointment);
      });
      fragment.appendChild(button);
    });

    container.appendChild(fragment);
  }

  function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) return text;
    const start = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const end = text.slice(index + query.length);
    return `${start}<span class="text-primary">${match}</span>${end}`;
  }

  function selectAppointment(appointment: AppointmentSummary) {
    console.log("a");
    if (!hiddenAppointmentInput || !hiddenPatientInput || !selectedPatientLabel)
      return;

    hiddenAppointmentInput.value = String(appointment.id);
    hiddenPatientInput.value = String(appointment.patient_id ?? "");
    selectedPatientLabel.textContent = `Selecionado: ${appointment.patient_name} • Consulta #${appointment.id}`;
    searchResultsContainer && (searchResultsContainer.innerHTML = "");
    if (searchInput) {
      searchInput.value = appointment.patient_name || "";
    }
  }

  // Close modal handlers
  const closeButton = modal.querySelector("#close-availability-modal");
  const cancelButton = modal.querySelector("#cancel-availability");
  const closeModal = () => modal.remove();

  closeButton?.addEventListener("click", closeModal);
  cancelButton?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Add more entry
  const addMoreButton = modal.querySelector("#add-more-entry");
  addMoreButton?.addEventListener("click", () => {
    const entriesContainer = modal.querySelector("#availability-entries");
    if (!entriesContainer) return;

    const newEntry = document.createElement("div");
    newEntry.className = "form";
    newEntry.innerHTML = `
      <div class="form__group" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
        <div>
          <label class="form__label">Dia da Semana</label>
          <select class="select day-select">
            <option value="0">Domingo</option>
            <option value="1" selected>Segunda</option>
            <option value="2">Terça</option>
            <option value="3">Quarta</option>
            <option value="4">Quinta</option>
            <option value="5">Sexta</option>
            <option value="6">Sábado</option>
          </select>
        </div>
        <div>
          <label class="form__label">Início</label>
          <input type="time" class="input start-time" value="09:00" />
        </div>
        <div>
          <label class="form__label">Fim</label>
          <input type="time" class="input end-time" value="12:00" />
        </div>
        <div>
          <button class="btn btn--danger btn--icon remove-entry" style="margin-bottom: 2px;">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `;
    entriesContainer.appendChild(newEntry);
    setupRemoveHandlers();
  });

  // Remove entry handlers
  function setupRemoveHandlers() {
    const removeButtons = modal.querySelectorAll(".remove-entry");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const entry = (e.target as HTMLElement).closest(".availability-entry");
        const entriesContainer = modal.querySelector("#availability-entries");
        if (entry && entriesContainer && entriesContainer.children.length > 1) {
          entry.remove();
        } else {
          uiStore.addToast(
            "error",
            "Você precisa manter pelo menos um horário",
          );
        }
      });
    });
  }
  setupRemoveHandlers();

  // Save handler
  const saveButton = modal.querySelector("#save-availability");
  saveButton?.addEventListener("click", async () => {
    const entries = modal.querySelectorAll(".availability-entry");
    const availabilities: AvailabilityInput[] = [];

    entries.forEach((entry) => {
      const daySelect = entry.querySelector(".day-select") as HTMLSelectElement;
      const startTime = entry.querySelector(".start-time") as HTMLInputElement;
      const endTime = entry.querySelector(".end-time") as HTMLInputElement;

      if (daySelect && startTime && endTime) {
        // Validation
        if (startTime.value >= endTime.value) {
          uiStore.addToast(
            "error",
            "Horário de início deve ser antes do horário de fim",
          );
          return;
        }

        availabilities.push({
          day_of_week: Number(daySelect.value),
          start_time: startTime.value,
          end_time: endTime.value,
          is_active: true,
        });
      }
    });

    if (availabilities.length === 0) {
      uiStore.addToast("error", "Adicione pelo menos um horário");
      return;
    }

    // Disable save button
    if (saveButton) {
      saveButton.textContent = "Salvando...";
      (saveButton as HTMLButtonElement).disabled = true;
    }

    try {
      const response = await createProfessionalAvailability(
        professionalId,
        availabilities,
      );

      if (response.success && response.data) {
        uiStore.addToast(
          "success",
          `${response.data.data.length} horário(s) cadastrado(s) com sucesso!`,
        );
        closeModal();
        // Refresh availability list (when implemented)
      } else if (response.error) {
        if (response.error.code === "OVERLAPPING_TIMES") {
          uiStore.addToast(
            "error",
            "Horários sobrepostos: " + response.error.message,
          );
        } else {
          uiStore.addToast(
            "error",
            response.error.message || "Erro ao salvar horários",
          );
        }
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      uiStore.addToast("error", "Erro ao salvar horários");
    } finally {
      if (saveButton) {
        saveButton.textContent = "Salvar Horários";
        (saveButton as HTMLButtonElement).disabled = false;
      }
    }
  });
}

function setupExamRequest(professionalId: number) {
  const requestButton = document.getElementById("request-exam-button");
  if (!requestButton) return;

  requestButton.addEventListener("click", () => {
    console.log("Solicitar Exame clicked", { professionalId });
    showExamRequestModal(professionalId);
  });
}

async function showExamRequestModal(professionalId: number) {
  // Prerender modal structure
  const modal = document.createElement("div");
  modal.className = "doctor-modal-overlay";
  modal.innerHTML = `
    <div class="doctor-modal">
      <div class="doctor-modal-header">
        <h3 class="doctor-modal-title">Solicitar Exame</h3>
        <button id="close-exam-modal" class="btn-icon-action">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="exam-request-form" class="space-y-4">
        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Selecione a Consulta *</label>
          <select id="exam-appointment-select" required class="doctor-modal-select">
             <option value="">Carregando consultas...</option>
          </select>
          <p class="doctor-modal-hint">Exames devem estar vinculados a uma consulta.</p>
        </div>

        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Exame *</label>
          <select id="exam-catalog-id" required class="doctor-modal-select">
             <option value="">Carregando lista...</option>
          </select>
        </div>

        <div class="doctor-modal-form-group">
           <label class="doctor-modal-label">Urgência *</label>
           <select id="exam-urgency" required class="doctor-modal-select">
             <option value="normal">Normal</option>
             <option value="urgent">Urgente</option>
             <option value="critical">Crítica</option>
           </select>
        </div>

        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Indicação Clínica *</label>
          <textarea id="exam-clinical-indication" required rows="4"
            class="doctor-modal-textarea"
            placeholder="Descreva a justificativa clínica..."></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" id="cancel-exam-request" class="btn-modal-cancel">
            Cancelar
          </button>
          <button type="submit" id="submit-exam-request" class="btn-modal-save btn-modal-save--exam">
            Solicitar Exame
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Load Appointments (Context)
  const appSelect = modal.querySelector(
    "#exam-appointment-select",
  ) as HTMLSelectElement;
  try {
    // Reuse listAppointments, filtering by professional and ensuring we get relevant ones
    // We might want past appointments too if they forgot to request exam during consultation?
    // Business rule says "Exame vinculado a appointment". Usually this is done during or shortly after.
    // Let's fetch recent and upcoming.
    const appResponse = await listAppointments({
      professionalId,
      pageSize: 50, // Limit to 50 most recent/upcoming
      // We don't strictly filter by date here to allow retro-active requests if needed,
      // but typically we prioritize active ones.
      // Let's just list them sorted by date (default).
    });

    if (
      appResponse.success &&
      appResponse.data &&
      appResponse.data.appointments &&
      appResponse.data.appointments.length > 0
    ) {
      appSelect.innerHTML =
        '<option value="">Selecione uma consulta...</option>' +
        appResponse.data.appointments
          .map(
            (app) =>
              // Store patient ID in data attribute for easy access
              `<option value="${app.id}" data-patient-id="${app.patient_id}">
                  ${app.date} ${app.time} - ${app.patient_name} (${app.status})
              </option>`,
          )
          .join("");
    } else {
      appSelect.innerHTML =
        '<option value="">Nenhuma consulta encontrada</option>';
    }
  } catch (error) {
    console.error("Error loading appointments for modal:", error);
    appSelect.innerHTML =
      '<option value="">Erro ao carregar consultas</option>';
  }

  // Load Catalog
  const selectEl = modal.querySelector("#exam-catalog-id") as HTMLSelectElement;
  try {
    const catResponse = await listCatalog();
    if (catResponse.success && catResponse.data) {
      selectEl.innerHTML =
        '<option value="">Selecione um exame...</option>' +
        catResponse.data
          .filter((i) => i.is_active)
          .map(
            (item) =>
              `<option value="${item.id}">${item.exam_name} (R$ ${item.base_price})</option>`,
          )
          .join("");
    } else {
      selectEl.innerHTML = '<option value="">Erro ao carregar exames</option>';
    }
  } catch (err) {
    selectEl.innerHTML = '<option value="">Erro desconhecido</option>';
  }

  // Close modal handlers
  const closeButton = modal.querySelector("#close-exam-modal");
  const cancelButton = modal.querySelector("#cancel-exam-request");
  const closeModal = () => modal.remove();

  closeButton?.addEventListener("click", closeModal);
  cancelButton?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Form submission
  const form = modal.querySelector("#exam-request-form") as HTMLFormElement;
  const submitButton = modal.querySelector(
    "#submit-exam-request",
  ) as HTMLButtonElement;

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const appSelect = document.getElementById(
      "exam-appointment-select",
    ) as HTMLSelectElement;
    const appointmentId = Number(appSelect.value);

    // Get patient ID from the selected option's data attribute
    const selectedOption = appSelect.options[appSelect.selectedIndex];
    const patientId = Number(selectedOption.getAttribute("data-patient-id"));

    const examCatalogId = Number(
      (document.getElementById("exam-catalog-id") as HTMLSelectElement).value,
    );
    const urgency = (
      document.getElementById("exam-urgency") as HTMLSelectElement
    ).value as any;
    const clinicalIndication = (
      document.getElementById("exam-clinical-indication") as HTMLTextAreaElement
    ).value.trim();

    // Validation
    if (!appointmentId || !patientId || !examCatalogId || !clinicalIndication) {
      uiStore.addToast("error", "Preencha todos os campos obrigatórios");
      return;
    }

    // Disable submit button
    submitButton.textContent = "Solicitando...";
    submitButton.disabled = true;

    try {
      const payload: CreateExamPayload = {
        appointment_id: appointmentId,
        patient_id: patientId,
        exam_catalog_id: examCatalogId,
        urgency: urgency,
        clinical_indication: clinicalIndication,
      };

      const response = await createExam(payload);

      if (response.success && response.data) {
        uiStore.addToast("success", `Exame solicitado com sucesso!`);
        closeModal();
      } else if (response.error) {
        const errorMessage = getExamErrorMessage(response.error.code);
        uiStore.addToast(
          "error",
          errorMessage || response.error.message || "Erro ao solicitar exame",
        );
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      uiStore.addToast("error", "Erro inesperado ao solicitar exame");
    } finally {
      submitButton.textContent = "Solicitar Exame";
      submitButton.disabled = false;
    }
  });
}

function getExamErrorMessage(errorCode?: string): string | undefined {
  const errorMessages: Record<string, string> = {
    EXAM_NOT_FOUND: "Exame não encontrado",
    FORBIDDEN: "Você não tem permissão para solicitar exames",
    INVALID_APPOINTMENT_ID: "ID de consulta inválido",
    APPOINTMENT_NOT_FOUND: "Consulta não encontrada",
    PATIENT_NOT_FOUND: "Paciente não encontrado",
    UNAUTHORIZED: "Você precisa estar autenticado",
  };

  return errorCode ? errorMessages[errorCode] : undefined;
}

function setupPrescriptionCreation(professionalId: number) {
  const createButton = document.getElementById("create-prescription-button");
  if (!createButton) return;

  createButton.addEventListener("click", () =>
    showPrescriptionModal(professionalId),
  );
}

async function showPrescriptionModal(professionalId: number) {
  const modal = document.createElement("div");
  modal.className = "doctor-modal-overlay";
  modal.innerHTML = `
    <div class="doctor-modal">
      <div class="doctor-modal-header">
        <h3 class="doctor-modal-title">Nova Prescrição</h3>
        <button id="close-prescription-modal" class="btn-icon-action">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="prescription-form" class="space-y-4">
        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Selecione a Consulta *</label>
          <select id="prescription-appointment-select" required class="doctor-modal-select">
             <option value="">Carregando consultas...</option>
          </select>
          <p class="doctor-modal-hint">A prescrição será vinculada ao paciente desta consulta.</p>
        </div>

        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Nome do Medicamento *</label>
          <input type="text" id="prescription-medication-name" required
            class="doctor-modal-input"
            placeholder="Ex: Amoxicilina 500mg" />
        </div>

        <div class="doctor-modal-grid-2">
            <div>
              <label class="doctor-modal-label">Dosagem</label>
              <input type="text" id="prescription-dosage"
                class="doctor-modal-input"
                placeholder="Ex: 500mg" />
            </div>

            <div>
              <label class="doctor-modal-label">Frequência</label>
              <input type="text" id="prescription-frequency"
                class="doctor-modal-input"
                placeholder="Ex: 3x ao dia" />
            </div>
        </div>

        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Duração (dias)</label>
          <input type="number" id="prescription-duration-days" min="1"
            class="doctor-modal-input"
            placeholder="Ex: 7" />
        </div>

        <div class="doctor-modal-form-group">
          <label class="doctor-modal-label">Instruções</label>
          <textarea id="prescription-instructions" rows="3"
            class="doctor-modal-textarea"
            placeholder="Ex: Tomar após as refeições com água"></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" id="cancel-prescription" class="btn-modal-cancel">
            Cancelar
          </button>
          <button type="submit" id="submit-prescription" class="btn-modal-save btn-modal-save--presc">
            Criar Prescrição
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Load Appointments (Context)
  const appSelect = modal.querySelector(
    "#prescription-appointment-select",
  ) as HTMLSelectElement;
  try {
    // Reuse listAppointments, filtering by professional and ensuring we get relevant ones
    // We might want past appointments too if they forgot to request exam during consultation?
    // Business rule says "Exame vinculado a appointment". Usually this is done during or shortly after.
    // Let's fetch recent and upcoming.
    const appResponse = await listAppointments({
      professionalId,
      pageSize: 50, // Limit to 50 most recent/upcoming
    });

    if (
      appResponse.success &&
      appResponse.data &&
      appResponse.data.appointments &&
      appResponse.data.appointments.length > 0
    ) {
      appSelect.innerHTML =
        '<option value="">Selecione uma consulta...</option>' +
        appResponse.data.appointments
          .map(
            (app) =>
              // Store patient ID in data attribute for easy access
              `<option value="${app.id}" data-patient-id="${app.patient_id}">
                    ${app.date} ${app.time} - ${app.patient_name} (${app.status})
                </option>`,
          )
          .join("");
    } else {
      appSelect.innerHTML =
        '<option value="">Nenhuma consulta encontrada</option>';
    }
  } catch (error) {
    console.error("Error loading appointments for modal:", error);
    appSelect.innerHTML =
      '<option value="">Erro ao carregar consultas</option>';
  }

  // Close modal handlers
  const closeButton = modal.querySelector("#close-prescription-modal");
  const cancelButton = modal.querySelector("#cancel-prescription");
  const closeModal = () => modal.remove();

  closeButton?.addEventListener("click", closeModal);
  cancelButton?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Form submission
  const form = modal.querySelector("#prescription-form") as HTMLFormElement;
  const submitButton = modal.querySelector(
    "#submit-prescription",
  ) as HTMLButtonElement;

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const appSelect = document.getElementById(
      "prescription-appointment-select",
    ) as HTMLSelectElement;

    const appointmentId = Number(appSelect.value);

    // Get patient ID from the selected option's data attribute
    const selectedOption = appSelect.options[appSelect.selectedIndex];
    const patientId = Number(selectedOption.getAttribute("data-patient-id"));

    const medicationName = (
      document.getElementById(
        "prescription-medication-name",
      ) as HTMLInputElement
    ).value.trim();
    const dosage = (
      document.getElementById("prescription-dosage") as HTMLInputElement
    ).value.trim();
    const frequency = (
      document.getElementById("prescription-frequency") as HTMLInputElement
    ).value.trim();
    const durationDaysInput = (
      document.getElementById("prescription-duration-days") as HTMLInputElement
    ).value;
    const instructions = (
      document.getElementById(
        "prescription-instructions",
      ) as HTMLTextAreaElement
    ).value.trim();

    // Validation for required fields
    if (!appointmentId || !patientId || !medicationName) {
      uiStore.addToast("error", "Preencha todos os campos obrigatórios");
      return;
    }

    // Disable submit button
    submitButton.textContent = "Criando...";
    submitButton.disabled = true;

    try {
      const payload: CreatePrescriptionPayload = {
        appointment_id: appointmentId,
        patient_id: patientId,
        medication_name: medicationName,
      };

      // Add optional fields if provided
      if (dosage) payload.dosage = dosage;
      if (frequency) payload.frequency = frequency;
      if (durationDaysInput) payload.duration_days = Number(durationDaysInput);
      if (instructions) payload.instructions = instructions;

      const response = await createPrescription(payload);

      if (response.success && response.data) {
        uiStore.addToast(
          "success",
          `Prescrição de "${medicationName}" criada com sucesso!`,
        );
        closeModal();
      } else if (response.error) {
        const errorMessage = getPrescriptionErrorMessage(response.error.code);
        uiStore.addToast(
          "error",
          errorMessage || response.error.message || "Erro ao criar prescrição",
        );
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      uiStore.addToast("error", "Erro inesperado ao criar prescrição");
    } finally {
      submitButton.textContent = "Criar Prescrição";
      submitButton.disabled = false;
    }
  });
}

function getPrescriptionErrorMessage(errorCode?: string): string | undefined {
  const errorMessages: Record<string, string> = {
    PRESCRIPTION_NOT_FOUND: "Prescrição não encontrada",
    FORBIDDEN: "Você não tem permissão para criar prescrições",
    INVALID_APPOINTMENT_ID: "ID de consulta inválido",
    APPOINTMENT_NOT_FOUND: "Consulta não encontrada",
    PATIENT_NOT_FOUND: "Paciente não encontrado",
    UNAUTHORIZED: "Você precisa estar autenticado",
    INVALID_MEDICATION: "Medicamento inválido",
  };

  return errorCode ? errorMessages[errorCode] : undefined;
}

function setupAgendaModal(professionalId: number) {
  const btn = document.getElementById("open-my-agenda-btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showAgendaModal(professionalId);
    });
  }
}

// State for Agenda Modal navigation
let currentAgendaDate = new Date();

async function showAgendaModal(professionalId: number) {
  // Remove existing modal if any
  const existingModal = document.getElementById("agenda-modal");
  if (existingModal) existingModal.remove();

  // Reset date to today on open
  currentAgendaDate = new Date();

  // Create Modal HTML
  const modalHtml = `
  <div id="agenda-modal" class="doctor-modal-overlay u-fade-in">
      <div class="doctor-modal doctor-modal--large u-slide-up">
          <div class="doctor-modal-header doctor-modal-header--border-b">
             <div class="agenda-nav-group">
                <h2 class="doctor-modal-title">Minha Agenda Semanal</h2>
                <div class="agenda-nav-controls">
                  <button id="agenda-prev-week" class="btn-agenda-nav">
                    <span class="material-symbols-outlined" style="font-size: 1.125rem;">chevron_left</span>
                  </button>
                  <div class="agenda-week-label" id="agenda-week-label">Carregando...</div>
                  <button id="agenda-next-week" class="btn-agenda-nav">
                    <span class="material-symbols-outlined" style="font-size: 1.125rem;">chevron_right</span>
                  </button>
                </div>
                <button id="agenda-today-btn" class="btn-agenda-today">
                  Hoje
                </button>
             </div>
             <button id="close-agenda-modal" class="btn-icon-action">
                 <span class="material-symbols-outlined">close</span>
             </button>
          </div>
          <div class="doctor-modal-body--full custom-scrollbar" id="agenda-grid-container">
              <div style="min-width: 800px; position: relative;" id="agenda-grid-content">
                  <!-- Grid content injected here -->
                  <div class="agenda-loading-state">
                      <span class="material-symbols-outlined u-spin">progress_activity</span> Carregando agenda...
                  </div>
              </div>
          </div>
      </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modal = document.getElementById("agenda-modal") as HTMLElement;
  const gridContent = document.getElementById(
    "agenda-grid-content",
  ) as HTMLElement;
  const closeBtn = document.getElementById("close-agenda-modal");
  const prevBtn = document.getElementById("agenda-prev-week");
  const nextBtn = document.getElementById("agenda-next-week");
  const todayBtn = document.getElementById("agenda-today-btn");

  const closeModal = () => modal.remove();
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Navigation Handlers
  const updateAgenda = () =>
    loadAgendaForDate(professionalId, currentAgendaDate, modal);

  prevBtn?.addEventListener("click", () => {
    currentAgendaDate.setDate(currentAgendaDate.getDate() - 7);
    updateAgenda();
  });

  nextBtn?.addEventListener("click", () => {
    currentAgendaDate.setDate(currentAgendaDate.getDate() + 7);
    updateAgenda();
  });

  todayBtn?.addEventListener("click", () => {
    currentAgendaDate = new Date();
    updateAgenda();
  });

  // Initial Load
  updateAgenda();
}

async function loadAgendaForDate(
  professionalId: number,
  date: Date,
  modal: HTMLElement,
) {
  const gridContent = modal.querySelector(
    "#agenda-grid-content",
  ) as HTMLElement;
  const label = modal.querySelector("#agenda-week-label");

  if (!gridContent) return;

  // Show Loading
  gridContent.innerHTML = `<div class="agenda-loading-state"><span class="material-symbols-outlined u-spin">progress_activity</span> Carregando...</div>`;

  // Calculate Week Dates (Monday to Saturday)
  const dayOfWeek = date.getDay(); // 0 = Sun
  const diffToMon = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(diffToMon);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5); // Sat
  endOfWeek.setHours(23, 59, 59, 999);

  // Update Label
  if (label) {
    label.textContent = `${startOfWeek.toLocaleDateString("pt-BR")} - ${endOfWeek.toLocaleDateString("pt-BR")}`;
  }

  // Fetch Appointments
  try {
    const response = await listAppointments({
      professionalId,
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
      pageSize: 100,
    });

    if (response.success && response.data) {
      renderWeeklyGrid(gridContent, response.data.appointments, startOfWeek, 6); // 6 days (Mon-Sat)
    } else {
      gridContent.innerHTML = `<p class="agenda-loading-state u-text-red">Erro ao carregar agenda.</p>`;
    }
  } catch (error) {
    console.error("Error fetching agenda:", error);
    gridContent.innerHTML = `<p class="agenda-loading-state u-text-red">Erro inesperado.</p>`;
  }
}

function renderWeeklyGrid(
  container: HTMLElement,
  appointments: AppointmentSummary[],
  startDate: Date,
  daysToShow: number,
) {
  const START_HOUR = 7;
  const END_HOUR = 19;
  const SLOT_HEIGHT = 80; // px
  const HEADER_HEIGHT = 50;
  const TIME_COL_WIDTH = 60;

  // Clear container
  container.innerHTML = "";
  container.style.height = `${(END_HOUR - START_HOUR + 1) * SLOT_HEIGHT + HEADER_HEIGHT}px`;

  // Create Grid Wrapper
  const gridWrapper = document.createElement("div");
  gridWrapper.className = "agenda-grid-container";
  container.appendChild(gridWrapper);

  // 1. Time Column
  const timeCol = document.createElement("div");
  timeCol.className = "agenda-time-column";
  timeCol.style.width = `${TIME_COL_WIDTH}px`;
  timeCol.style.paddingTop = `${HEADER_HEIGHT}px`; // align with grid rows

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const slot = document.createElement("div");
    slot.className = "agenda-time-slot-label";
    slot.style.height = `${SLOT_HEIGHT}px`;
    slot.textContent = `${String(h).padStart(2, "0")}:00`;
    timeCol.appendChild(slot);
  }
  gridWrapper.appendChild(timeCol);

  // 2. Days Columns
  const daysWrapper = document.createElement("div");
  daysWrapper.className = "agenda-days-wrapper";
  gridWrapper.appendChild(daysWrapper);

  const dayWidthPercent = 100 / daysToShow;

  for (let i = 0; i < daysToShow; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayName = currentDate.toLocaleDateString("pt-BR", {
      weekday: "short",
    });
    const dayNum = currentDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    // Column
    const dayCol = document.createElement("div");
    dayCol.className = "agenda-day-column";
    dayCol.style.width = `${dayWidthPercent}%`;

    // Header
    const header = document.createElement("div");
    header.className = "agenda-day-header";
    header.innerHTML = `
      <span class="agenda-day-name">${dayName}</span>
      <span class="agenda-day-number">${dayNum}</span>
    `;
    dayCol.appendChild(header);

    // Slots Background
    const slotsBg = document.createElement("div");
    slotsBg.className = "agenda-slots-bg";
    // Render horizontal lines
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const line = document.createElement("div");
      line.className = "agenda-grid-line";
      line.style.top = `${(h - START_HOUR) * SLOT_HEIGHT}px`;
      // line.style.height = `${SLOT_HEIGHT}px`; // set in CSS or irrelevant as it's a border
      slotsBg.appendChild(line);
    }

    // Add appointments
    const dayApps = appointments.filter((app) => app.date === dateStr);
    dayApps.forEach((app) => {
      const [h, m] = app.time.split(":").map(Number);
      if (h < START_HOUR || h > END_HOUR) return;

      const top = (h - START_HOUR + m / 60) * SLOT_HEIGHT;
      const height = ((app.duration_minutes || 60) / 60) * SLOT_HEIGHT;

      const card = document.createElement("div");

      let statusClass = "agenda-event-card--scheduled";
      if (app.status === "completed") statusClass = "agenda-event-card--completed";
      if (app.status === "cancelled") statusClass = "agenda-event-card--cancelled";

      card.className = `agenda-event-card ${statusClass}`;
      card.style.top = `${top}px`;
      card.style.height = `${Math.max(height, 30)}px`; // min height for visibility

      card.innerHTML = `
        <div class="agenda-event-title">${app.patient_name}</div>
        <div class="agenda-event-time">
           <span class="material-symbols-outlined" style="font-size: 10px;">schedule</span> ${app.time}
        </div>
      `;

      card.addEventListener("click", () => {
        uiStore.addToast(
          "info",
          `Consulta: ${app.patient_name} (${app.time}) - ${app.status}`,
        );
      });

      slotsBg.appendChild(card);
    });

    dayCol.appendChild(slotsBg);
    daysWrapper.appendChild(dayCol);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDoctorDashboard);
} else {
  initDoctorDashboard();
}
