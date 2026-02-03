import "../../css/base/reset.css";
import "../../css/pages/schedule-appointment.css";
import {
  cancelAppointment,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
} from "../services/appointmentsService";
import {
  getProfessionalAvailability,
  listProfessionals,
} from "../services/professionalsService";
import { logout } from "../services/authService"
import { authStore } from "../stores/authStore";
import { dashboardStore } from "../stores/dashboardStore";
import { uiStore } from "../stores/uiStore";
import { Navigation } from "../components/Navigation";
import type { AppointmentSummary } from "../types/appointments";
import type { UserSession } from "../types/auth";
import type {
  ProfessionalAvailabilityEntry,
  ProfessionalSummary,
} from "../types/professionals";
import { mapAppointmentError } from "../utils/errorMapper";
import { formatSpecialty } from "../utils/formatters";

function buildAppointmentStatusText(appointments: AppointmentSummary[]) {
  const next = appointments[0];
  return next
    ? `Próximo: ${next.professional_name} • ${formatDate(next.date)} • ${next.time}`
    : "Nenhum agendamento";
}

function buildAppointmentsLoadingState() {
  return `
    <div class="state-card state-card--transparent state-card--small">
      <span class="material-symbols-outlined state-card__icon state-card__icon--small u-spin">sync</span>
      <p class="state-card__description">Sincronizando dados...</p>
    </div>
  `;
}

function buildAppointmentsEmptyState(title: string, description: string) {
  return `
    <div class="state-card state-card--transparent state-card--small">
      <p class="state-card__title">${title}</p>
      <p class="state-card__description">${description}</p>
    </div>
  `;
}

function buildAppointmentCard(appointment: AppointmentSummary) {
  const canModify =
    appointment.status === "scheduled" || appointment.status === "confirmed";

  return `
    <div class="appointment-card">
      <div class="appointment-card__doctor-group">
        <div class="appointment-card__avatar" style="background-image: url('${appointment.professional_image || ""}')">
          ${!appointment.professional_image ? getInitials(appointment.professional_name) : ""}
        </div>
        <div class="appointment-card__info">
          <div class="appointment-card__header">
            <h3 class="appointment-card__name">${appointment.professional_name}</h3>
            <span class="status-badge status-badge--${appointment.status}">${getStatusLabel(appointment.status)}</span>
          </div>
          <p class="appointment-card__specialty">${formatSpecialty(appointment.specialty)}</p>
          <div class="appointment-card__meta">
            <div class="appointment-card__meta-item">
              <span class="material-symbols-outlined appointment-card__meta-icon">calendar_month</span>
              ${formatDate(appointment.date)}
            </div>
            <div class="appointment-card__meta-item">
              <span class="material-symbols-outlined appointment-card__meta-icon">schedule</span>
              ${appointment.time}
            </div>
          </div>
        </div>
      </div>
      
      ${
        canModify
          ? `
        <div class="appointment-card__actions">
          <button
            class="appointment-card__btn appointment-card__btn--outline"
            data-action="reschedule-appointment"
            data-appointment-id="${appointment.id}"
            data-professional-id="${appointment.professional_id}"
          >
            Reagendar
          </button>
          <button
            class="appointment-card__btn appointment-card__btn--danger"
            data-action="cancel-appointment"
            data-appointment-id="${appointment.id}"
          >
            Cancelar
          </button>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function resolveSession() {
  return (
    getSessionFromStorage() ??
    authStore.getSession() ??
    authStore.refreshSession()
  );
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Realizado",
    cancelled_by_patient: "Cancelado",
    cancelled_by_clinic: "Cancelado",
  };

  return map[status] ?? status;
}

function getAppointmentDateTime(appointment: AppointmentSummary) {
  const dateTimeString = `${appointment.date}T${appointment.time}`;
  return new Date(dateTimeString);
}

const doctorsGrid = document.getElementById("doctors-grid");
const toastContainer = document.getElementById("toast-container");
const filtersContainer = document.getElementById("filters-container");
const searchInput = document.getElementById(
  "search-input",
) as HTMLInputElement | null;
const appointmentsStatus = document.getElementById("appointments-status");
const appointmentsList = document.getElementById("appointments-list");

type FiltersState = {
  specialty: string;
  name: string;
};

const filters: FiltersState = {
  specialty: "",
  name: "",
};

let professionalsCache: ProfessionalSummary[] = [];

document.addEventListener("DOMContentLoaded", () => {
  new Navigation();
  hydrateSessionUser();
  renderFilters();
  bindSearchInput();
  loadProfessionals();
  loadPatientAppointments();
});

async function loadProfessionals() {
  if (!doctorsGrid) return;

  const session = getSessionFromStorage() ?? authStore.getSession();
  if (!session) {
    redirectToLogin();
    return;
  }

  const response = await listProfessionals({
    specialty: filters.specialty || undefined,
    name: filters.name || undefined,
  });

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar profissionais.",
    );
    renderToasts();
    doctorsGrid.innerHTML = buildEmptyState(
      "Não foi possível carregar profissionais agora.",
    );
    return;
  }

  professionalsCache = response.data.data;
  renderProfessionals(response.data.data);
  if (!filters.specialty && !filters.name) {
    updateFiltersOptions(response.data.data);
  }
}

const appointmentCountLabel = document.getElementById("appointments-count");

async function loadPatientAppointments(useCache = true) {
  if (!appointmentsList || !appointmentsStatus) return;

  appointmentsStatus.textContent = "Sincronizando dados...";
  appointmentsList.innerHTML = buildAppointmentsLoadingState();

  const session = await resolveSession();
  if (!session) {
    redirectToLogin();
    return;
  }

  const filters = session.role === "patient" ? { patientId: session.id } : {};
  const response = await listAppointments(filters, useCache);

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar seus agendamentos.",
    );
    renderToasts();
    appointmentsStatus.textContent = "Status indisponível";
    appointmentsList.innerHTML = buildAppointmentsEmptyState(
      "Não foi possível sincronizar seus agendamentos.",
      "Tente novamente em instantes.",
    );
    return;
  }

  const appointments = response.data.appointments;
  if (appointments.length === 0) {
    appointmentsStatus.textContent = "Nenhum agendamento encontrado";
    appointmentsList.innerHTML = buildAppointmentsEmptyState(
      "Você ainda não tem agendamentos.",
      "Agende sua primeira consulta.",
    );
    return;
  }

  const now = new Date();
  const futureAppointments = appointments
    .map((appointment) => ({
      ...appointment,
      dateTime: getAppointmentDateTime(appointment),
    }))
    .filter(
      (appointment) =>
        !Number.isNaN(appointment.dateTime.getTime()) &&
        appointment.dateTime >= now,
    )
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  if (futureAppointments.length === 0) {
    appointmentsStatus.textContent = "Nenhum agendamento futuro";
    appointmentsList.innerHTML = buildAppointmentsEmptyState(
      "Você ainda não tem agendamentos futuros.",
      "Agende sua próxima consulta.",
    );
    return;
  }

  // Contagem de agendamentos
  const limitedAppointments = futureAppointments.filter(
    (a) => a.status !== "cancelled_by_patient",
  );
  appointmentCountLabel!.textContent = `${limitedAppointments.length} agendamentos`;
  appointmentsStatus.textContent =
    buildAppointmentStatusText(limitedAppointments);

  // Setup pagination
  currentAppointmentPage = 0;
  appointmentPageSize = 4; // Limit to 4 per page
  cachedAppointments = limitedAppointments;

  renderPaginatedAppointments();
}

let currentAppointmentPage = 0;
let appointmentPageSize = 4;
let cachedAppointments: AppointmentSummary[] = [];

function renderPaginatedAppointments() {
  if (!appointmentsList) return;

  const totalPages = Math.ceil(cachedAppointments.length / appointmentPageSize);
  const start = currentAppointmentPage * appointmentPageSize;
  const end = start + appointmentPageSize;
  const pageItems = cachedAppointments.slice(start, end);

  // Use a grid container for the cards
  const gridHtml = `
    <div class="appointments-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; width: 100%;">
      ${pageItems.map((app) => buildAppointmentCard(app)).join("")}
    </div>
  `;

  // Pagination controls
  let paginationHtml = "";
  if (totalPages > 1) {
    paginationHtml = `
      <div class="pagination-controls" style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem; justify-content: center;">
        <button 
          class="pagination-btn" 
          ${currentAppointmentPage === 0 ? "disabled" : ""}
          style="background: none; border: none; color: ${currentAppointmentPage === 0 ? "var(--text-secondary)" : "var(--primary)"}; cursor: ${currentAppointmentPage === 0 ? "default" : "pointer"};"
          onclick="window.prevAppointmentPage()"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="pagination-info" style="color: var(--text-secondary); font-size: 0.875rem;">
          ${currentAppointmentPage + 1} de ${totalPages}
        </span>
        <button 
          class="pagination-btn" 
          ${currentAppointmentPage >= totalPages - 1 ? "disabled" : ""}
          style="background: none; border: none; color: ${currentAppointmentPage >= totalPages - 1 ? "var(--text-secondary)" : "var(--primary)"}; cursor: ${currentAppointmentPage >= totalPages - 1 ? "default" : "pointer"};"
          onclick="window.nextAppointmentPage()"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    `;
  }

  appointmentsList.innerHTML = gridHtml + paginationHtml;

  // Re-attach event listeners
  bindAppointmentCardEvents(appointmentsList);
}

// Expose pagination functions to window
(window as any).prevAppointmentPage = () => {
  if (currentAppointmentPage > 0) {
    currentAppointmentPage--;
    renderPaginatedAppointments();
  }
};
(window as any).nextAppointmentPage = () => {
  const totalPages = Math.ceil(cachedAppointments.length / appointmentPageSize);
  if (currentAppointmentPage < totalPages - 1) {
    currentAppointmentPage++;
    renderPaginatedAppointments();
  }
};

function bindAppointmentCardEvents(container: HTMLElement) {
  container
    .querySelectorAll("[data-action='cancel-appointment']")
    .forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.currentTarget as HTMLButtonElement;
        const appointmentId = Number(target.dataset.appointmentId);
        if (!appointmentId) return;

        await handleCancelAppointment(appointmentId);
      });
    });

  container
    .querySelectorAll("[data-action='reschedule-appointment']")
    .forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.currentTarget as HTMLButtonElement;
        const appointmentId = Number(target.dataset.appointmentId);
        const professionalId = Number(target.dataset.professionalId);
        if (!appointmentId || !professionalId) return;

        await handleRescheduleClick(appointmentId, professionalId);
      });
    });
}

function renderProfessionals(professionals: ProfessionalSummary[]) {
  if (!doctorsGrid) return;

  if (professionals.length === 0) {
    doctorsGrid.innerHTML = buildEmptyState(
      "Nenhum profissional disponível no momento.",
    );
    return;
  }

  doctorsGrid.innerHTML = professionals
    .map((professional) => buildProfessionalCard(professional))
    .join("");

  doctorsGrid
    .querySelectorAll("[data-action='view-availability']")
    .forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.currentTarget as HTMLButtonElement;
        const professionalId = Number(target.dataset.professionalId);
        if (!professionalId) return;

        await handleAvailabilityClick(target, professionalId);
      });
    });
}

function buildProfessionalCard(professional: ProfessionalSummary) {
  const council = professional.council ? `• ${professional.council}` : "";
  const registrationLabel = professional.registration_number
    ? `CRM ${professional.registration_number} ${council}`.trim()
    : "Registro a confirmar";

  return `
    <div class="professional-card">
      <div class="professional-card__top">
        <div class="professional-card__avatar" style="background-image: url('${professional.image || ""}')">
          ${!professional.image ? getInitials(professional.name) : ""}
        </div>
        <div class="professional-card__info">
          <div class="professional-card__header">
            <div>
              <h3 class="professional-card__name">${professional.name}</h3>
              <p class="professional-card__specialty">${formatSpecialty(professional.specialty)}</p>
            </div>
          </div>
          <p class="professional-card__crm">${registrationLabel}</p>
          <div class="professional-card__tags">
            <span class="professional-card__tag">Disponível hoje</span>
            <span class="professional-card__tag">${formatSpecialty(professional.specialty)}</span>
          </div>
        </div>
      </div>

      <div class="professional-card__footer">
        <div class="professional-card__price">
          <span class="professional-card__price-label">Consulta</span>
          <span class="professional-card__price-value">${professional.consultation_price ? formatCurrency(professional.consultation_price) : "A confirmar"}</span>
        </div>
        <button
          class="professional-card__book-btn"
          data-action="view-availability"
          data-professional-id="${professional.id}"
        >
          Agendar
        </button>
      </div>
    </div>
  `;
}

let searchDebounceTimer: number | undefined;

function renderFilters() {
  const specialtySelect = document.getElementById(
    "header-filter-specialty",
  ) as HTMLSelectElement | null;

  if (specialtySelect) {
    specialtySelect.addEventListener("change", async () => {
      filters.specialty = specialtySelect.value;
      await loadProfessionals();
    });
  }
}

function updateFiltersOptions(professionals: ProfessionalSummary[]) {
  const specialtySelect = document.getElementById(
    "header-filter-specialty",
  ) as HTMLSelectElement | null;

  if (!specialtySelect) return;

  const specialties = Array.from(
    new Set(professionals.map((item) => item.specialty).filter(Boolean)),
  );
  specialties.sort((a, b) => a.localeCompare(b));

  const currentValue = specialtySelect.value;
  specialtySelect.innerHTML = [
    '<option value="">Todas Especialidades</option>',
    ...specialties.map(
      (specialty) =>
        `<option value="${specialty}">${formatSpecialty(specialty)}</option>`,
    ),
  ].join("");

  specialtySelect.value = currentValue;
}

function bindSearchInput() {
  if (!searchInput) return;
  searchInput.addEventListener("input", async () => {
    filters.name = searchInput.value.trim();
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = window.setTimeout(async () => {
      await loadProfessionals();
    }, 300);
  });
}

async function handleAvailabilityClick(
  button: HTMLButtonElement,
  professionalId: number,
) {
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="material-symbols-outlined u-spin" style="font-size: 20px;">sync</span> Agendando...`;

  const response = await getProfessionalAvailability(professionalId, {
    daysAhead: 7,
  });

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ?? "Não foi possível carregar os horários.",
    );
    renderToasts();
    button.innerHTML = originalText;
    button.disabled = false;
    return;
  }

  const futureSlots = response.data
    .filter((slot) => slot.is_available)
    .filter((slot) => {
      const slotDate = new Date(`${slot.date}T${slot.time}`);
      return slotDate.getTime() > Date.now();
    });
  uiStore.addToast(
    "success",
    futureSlots.length
      ? `Encontramos ${futureSlots.length} horários disponíveis.`
      : "Nenhum horário disponível para os próximos dias.",
  );
  renderToasts();

  const professional = professionalsCache.find((p) => p.id === professionalId);
  if (!professional) return;

  createAvailabilityModal(professional, futureSlots);

  button.innerHTML = originalText;
  button.disabled = false;
}

function buildEmptyState(message: string) {
  return `
    <div class="doctors-grid__empty-state">
      <span class="material-symbols-outlined doctors-grid__empty-icon">search_off</span>
      <h3 class="doctors-grid__empty-title">${message}</h3>
      <p class="doctors-grid__empty-desc">Tente novamente em instantes.</p>
    </div>
  `;
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
}

function redirectToLogin() {
  window.location.href = getBasePath() + "login.html";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function renderToasts() {
  if (!toastContainer) return;
  toastContainer.innerHTML = "";
  uiStore.getToasts().forEach((toast) => {
    const toastElement = document.createElement("div");
    toastElement.className = `toast-item toast-item-${toast.level || "info"}`;
    toastElement.textContent = toast.text;
    toastContainer.appendChild(toastElement);
  });
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function clearFilters() {
  filters.specialty = "";
  filters.name = "";

  if (searchInput) searchInput.value = "";

  const specialtySelect = document.getElementById(
    "filter-specialty",
  ) as HTMLSelectElement | null;
  const nameInput = document.getElementById(
    "filter-name",
  ) as HTMLInputElement | null;

  if (specialtySelect) specialtySelect.value = "";
  if (nameInput) nameInput.value = "";

  loadProfessionals();
}
function createCheckoutModal(
  professional: ProfessionalSummary,
  date: string,
  time: string,
) {
  const existing = document.getElementById("checkout-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "checkout-modal";
  modal.className = "checkout-modal-overlay";

  modal.innerHTML = `
    <div class="checkout-modal">
      <div class="checkout-modal__header">
        <h3 class="checkout-modal__title">Resumo do Agendamento</h3>
        <button data-action="close-checkout" class="checkout-modal__close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="checkout-modal__content">
        <div class="checkout-summary">
          <div class="checkout-summary__avatar">
            ${getInitials(professional.name)}
          </div>
          <div class="checkout-summary__info">
            <h4>${professional.name}</h4>
            <p>${formatSpecialty(professional.specialty)}</p>
          </div>
        </div>

        <div class="checkout-details">
          <div class="checkout-details__row">
            <span class="checkout-details__label">Data</span>
            <span class="checkout-details__value">${formatDateFull(date)}</span>
          </div>
          <div class="checkout-details__row">
            <span class="checkout-details__label">Horário</span>
            <span class="checkout-details__value">${time}</span>
          </div>
          <div class="checkout-details__row">
            <span class="checkout-details__label">Local</span>
            <span class="checkout-details__value">Unidade principal</span>
          </div>
          <div class="checkout-details__divider"></div>
          <div class="checkout-details__row">
            <span class="checkout-details__total-label">Valor Total</span>
            <span class="checkout-details__total-value">${
              professional.consultation_price
                ? formatCurrency(professional.consultation_price)
                : "A confirmar"
            }</span>
          </div>
        </div>

        <div>
          <label class="checkout-payment__label">Forma de Pagamento</label>
          <div class="checkout-payment__grid">
            <button class="checkout-payment__btn checkout-payment__btn--active">
              <span class="material-symbols-outlined">credit_card</span>
              Crédito
            </button>
            <button class="checkout-payment__btn">
              <span class="material-symbols-outlined">pix</span>
              PIX
            </button>
          </div>
        </div>

        <div>
          <label class="checkout-installments__label">Parcelamento</label>
          <select class="filters-control"> <!-- Reusing filters-control for consistent input style -->
            <option value="1">1x sem juros</option>
            <option value="2">2x sem juros</option>
          </select>
        </div>

        <button data-action="checkout-confirm" class="checkout-confirm-btn">
          <span class="material-symbols-outlined">lock</span>
          Pagar e Confirmar
        </button>
      </div>
    </div>
  `;

  modal
    .querySelector("[data-action='close-checkout']")
    ?.addEventListener("click", () => {
      modal.remove();
    });

  const confirmButton = modal.querySelector(
    "[data-action='checkout-confirm']",
  ) as HTMLButtonElement | null;

  confirmButton?.addEventListener("click", async () => {
    if (!confirmButton) return;
    const originalText = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.textContent = "Confirmando...";

    try {
      const session = await resolveSession();
      if (!session) {
        redirectToLogin();
        return;
      }

      const response = await createAppointment({
        patientId: session.id,
        professionalId: professional.id,
        date,
        time,
        type: "presencial",
        price: professional.consultation_price ?? 0,
      });

      if (!response.success) {
        const errorMessage = response.error
          ? mapAppointmentError(response.error)
          : "Não foi possível confirmar o agendamento.";
        uiStore.addToast("error", errorMessage);
        renderToasts();
        return;
      }

      uiStore.addToast(
        "success",
        `Agendamento confirmado para ${formatDateFull(date)} às ${time}.`,
      );
      renderToasts();
      modal.remove();

      // Force reload of appointments list with fresh data
      await loadPatientAppointments(false);

      // Reload dashboard for patient dashboard page
      await dashboardStore.loadData();
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = originalText ?? "Pagar e Confirmar";
    }
  });

  document.body.appendChild(modal);
}

async function handleCancelAppointment(appointmentId: number) {
  const confirmed = confirm(
    "Tem certeza que deseja cancelar este agendamento? Reembolsos podem variar conforme a antecedência.",
  );
  if (!confirmed) return;

  const response = await cancelAppointment(appointmentId);

  if (!response.success) {
    const errorMessage = response.error
      ? mapAppointmentError(response.error)
      : "Não foi possível cancelar o agendamento.";
    uiStore.addToast("error", errorMessage);
    renderToasts();
    return;
  }

  const refundInfo = response.data?.refund
    ? ` Reembolso de ${response.data.refund.percentage}% (${formatCurrency(response.data.refund.amount)}) será processado.`
    : "";

  uiStore.addToast(
    "success",
    `Agendamento cancelado com sucesso.${refundInfo}`,
  );
  renderToasts();
  await loadPatientAppointments(false);

  // Reload dashboard for patient dashboard page
  await dashboardStore.loadData();
}

function formatDateFull(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function createAvailabilityModal(
  professional: ProfessionalSummary,
  availability: ProfessionalAvailabilityEntry[],
) {
  const existing = document.getElementById("availability-modal");
  if (existing) existing.remove();

  // Group slots by date
  const slotsByDate = availability.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, typeof availability>,
  );

  const modal = document.createElement("div");
  modal.id = "availability-modal";
  modal.className = "availability-modal-overlay";

  // Generate HTML for grouped slots
  // Generate HTML for grouped slots
  const slotsHtml = Object.entries(slotsByDate)
    .map(
      ([date, slots]) => `
    <div class="slots-group">
      <h4 class="slots-date-header">
        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">calendar_month</span>
        <span style="text-transform: capitalize;">${formatDateFull(date)}</span>
      </h4>
      <div class="slots-grid">
        ${slots
          .map(
            (slot) => `
          <button
            class="slot-btn"
            data-action="select-slot"
            data-slot-date="${slot.date}"
            data-slot-time="${slot.time}"
          >
            <span>${slot.time}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");

  modal.innerHTML = `
    <div class="availability-modal">
      <div class="availability-modal__header">
        <div class="availability-modal__title-group">
           <div class="availability-modal__avatar">
              ${getInitials(professional.name)}
           </div>
           <div>
              <h3 class="availability-modal__title">Agendar com ${professional.name}</h3>
              <p class="availability-modal__subtitle">${professional.specialty}</p>
           </div>
        </div>
        <button data-action="close-availability" class="availability-modal__close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="availability-modal__content">
        <p class="availability-modal__instruction">
          Selecione um horário para confirmar seu agendamento:
        </p>

        <div class="custom-scrollbar" style="max-height: 60vh; overflow-y: auto; padding-right: 0.5rem;">
          ${availability.length > 0 ? slotsHtml : `<div class="state-card state-card--transparent"><p class="state-card__description">Nenhum horário disponível para os próximos dias.</p></div>`}
        </div>
      </div>
    </div>
  `;

  modal
    .querySelector("[data-action='close-availability']")
    ?.addEventListener("click", () => {
      modal.remove();
    });

  modal.querySelectorAll("[data-action='select-slot']").forEach((button) => {
    button.addEventListener("click", (event) => {
      const target = event.currentTarget as HTMLButtonElement;
      const selectedDate = target.dataset.slotDate;
      const selectedTime = target.dataset.slotTime;

      if (!selectedDate || !selectedTime) return;

      createCheckoutModal(professional, selectedDate, selectedTime);
      modal.remove();
    });
  });

  document.body.appendChild(modal);
}

async function handleRescheduleClick(
  appointmentId: number,
  professionalId: number,
) {
  const response = await getProfessionalAvailability(professionalId, {
    daysAhead: 7,
  });

  if (!response.success || !response.data) {
    uiStore.addToast(
      "error",
      response.error?.message ??
        "Não foi possível carregar os horários disponíveis.",
    );
    renderToasts();
    return;
  }

  const futureSlots = response.data
    .filter((slot) => slot.is_available)
    .filter((slot) => {
      const slotDate = new Date(`${slot.date}T${slot.time}`);
      return slotDate.getTime() > Date.now();
    });

  if (futureSlots.length === 0) {
    uiStore.addToast(
      "error",
      "Não há horários disponíveis para reagendamento no momento.",
    );
    renderToasts();
    return;
  }

  createRescheduleModal(appointmentId, futureSlots);
}

function createRescheduleModal(
  appointmentId: number,
  availability: ProfessionalAvailabilityEntry[],
) {
  const existing = document.getElementById("reschedule-modal");
  if (existing) existing.remove();

  // Group slots by date
  const slotsByDate = availability.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, typeof availability>,
  );

  const modal = document.createElement("div");
  modal.id = "reschedule-modal";
  modal.className = "availability-modal-overlay";

  // Generate HTML for grouped slots
  const slotsHtml = Object.entries(slotsByDate)
    .map(
      ([date, slots]) => `
    <div class="slots-group">
      <h4 class="slots-date-header">
        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">calendar_month</span>
        <span style="text-transform: capitalize;">${formatDateFull(date)}</span>
      </h4>
      <div class="slots-grid">
        ${slots
          .map(
            (slot) => `
          <button
            class="slot-btn"
            data-action="select-reschedule-slot"
            data-slot-date="${slot.date}"
            data-slot-time="${slot.time}"
          >
            <span>${slot.time}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");

  modal.innerHTML = `
    <div class="availability-modal">
      <div class="availability-modal__header">
        <div class="availability-modal__title-group">
           <div class="availability-modal__avatar">
              <span class="material-symbols-outlined">edit_calendar</span>
           </div>
           <div>
              <h3 class="availability-modal__title">Reagendar Consulta</h3>
              <p class="availability-modal__subtitle">Selecione um novo horário</p>
           </div>
        </div>
        <button data-action="close-reschedule" class="availability-modal__close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="availability-modal__content">
        <p class="availability-modal__instruction">
          Selecione um novo horário disponível para reagendar sua consulta:
        </p>

        <div class="custom-scrollbar" style="max-height: 60vh; overflow-y: auto; padding-right: 0.5rem;">
          ${availability.length > 0 ? slotsHtml : `<div class="state-card state-card--transparent"><p class="state-card__description">Nenhum horário disponível para os próximos dias.</p></div>`}
        </div>
      </div>
    </div>
  `;

  modal
    .querySelector("[data-action='close-reschedule']")
    ?.addEventListener("click", () => {
      modal.remove();
    });

  modal
    .querySelectorAll("[data-action='select-reschedule-slot']")
    .forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.currentTarget as HTMLButtonElement;
        const newDate = target.dataset.slotDate;
        const newTime = target.dataset.slotTime;
        if (!newDate || !newTime) return;

        await handleRescheduleConfirm(appointmentId, newDate, newTime, modal);
      });
    });

  document.body.appendChild(modal);
}

async function handleRescheduleConfirm(
  appointmentId: number,
  newDate: string,
  newTime: string,
  modal: HTMLElement,
) {
  const confirmed = confirm(
    `Confirmar reagendamento para ${formatDateFull(newDate)} às ${newTime}?`,
  );
  if (!confirmed) return;

  const response = await rescheduleAppointment(appointmentId, {
    newDate,
    newTime,
  });

  if (!response.success) {
    const errorMessage = response.error
      ? mapAppointmentError(response.error)
      : "Não foi possível reagendar o agendamento.";
    uiStore.addToast("error", errorMessage);
    renderToasts();
    return;
  }

  uiStore.addToast(
    "success",
    `Consulta reagendada com sucesso para ${formatDateFull(newDate)} às ${newTime}.`,
  );
  renderToasts();
  modal.remove();
  await loadPatientAppointments(false);

  // Reload dashboard for patient dashboard page
  await dashboardStore.loadData();
}

(window as Window & { clearFilters?: () => void }).clearFilters = clearFilters;
