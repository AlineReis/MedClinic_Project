import { Navigation } from "../components/Navigation";
import { ToastContainer } from "../components/ToastContainer";
import {
  createPatient,
  searchPatients,
  updatePatient,
  deletePatient,
  getPatient,
  type PatientSummary,
} from "../services/patientService";
import { listAppointments } from "../services/appointmentsService";
import { logout } from "../services/authService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";

let toastContainer: ToastContainer | null = null;
let navigation: Navigation | null = null;
let currentPatients: PatientSummary[] = [];
let currentPage = 1;
const pageSize = 10;

async function initPatientsPage() {
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

  setupUserProfile(session);
  setupLogoutButton();
  setupTheme(); // Initialize theme
  setupModal();
  setupSearch();
  setupPagination();

  // Initial load
  loadPatients();
}

function setupTheme() {
  const html = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const icon = toggleBtn?.querySelector("span");

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn?.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme: string) {
    if (icon) {
      icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
    }
  }
}

function setupUserProfile(session: any) {
  const userNameEls = document.querySelectorAll("[data-user-name]");
  const userRoleEls = document.querySelectorAll("[data-user-role]");
  const userInitialsEls = document.querySelectorAll("[data-user-initials]");

  userNameEls.forEach((el) => (el.textContent = session.name));
  userRoleEls.forEach((el) => {
    const roleMap: Record<string, string> = {
      receptionist: "Recepcionista",
      doctor: "Médico",
      admin: "Administrador",
      clinic_admin: "Admin da Clínica",
      patient: "Paciente",
    };
    el.textContent = roleMap[session.role] || session.role;
  });

  const initials = session.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  userInitialsEls.forEach((el) => (el.textContent = initials));
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

async function loadPatients(query = "") {
  const tbody = document.getElementById("patients-list-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="u-text-center u-padding-medium u-text-secondary">Carregando...</td></tr>`;

  try {
    // searchPatients uses backend filtering. For pagination, the backend supports it but our service wrapper might need adjustment if we want strict pagination control.
    // For now, searchPatients returns all matches or paginated by default 10.
    // We will use the search function which accepts query.
    const response = await searchPatients(query);

    if (response.success && response.data) {
      currentPatients = response.data;
      renderPatients(currentPatients);
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="u-text-center u-padding-medium u-text-error">Erro ao carregar pacientes</td></tr>`;
      uiStore.addToast("error", "Erro ao buscar dados.");
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" class="u-text-center u-padding-medium u-text-error">Erro inesperado</td></tr>`;
  }
}

function renderPatients(patients: PatientSummary[]) {
  const tbody = document.getElementById("patients-list-body");
  if (!tbody) return;

  if (patients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="u-text-center u-padding-medium u-text-secondary">
          <div class="u-flex-column u-items-center u-gap-small">
            <span class="material-symbols-outlined" style="font-size: 2.25rem;">person_off</span>
            <p>Nenhum paciente encontrado</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = patients
    .map(
      (p) => `
      <tr class="table-row">
        <td class="font-medium">${p.name}</td>
        <td class="text-secondary">${p.cpf || "-"}</td>
        <td class="text-secondary">${p.email}</td>
        <td class="text-secondary">${p.phone || "-"}</td>
        <td class="text-right">
          <button class="edit-btn btn-icon-action" data-id="${p.id}" title="Editar">
            <span class="material-symbols-outlined" style="font-size: 1.25rem;">edit</span>
          </button>
          <!-- Delete Logic (Optional, usually sensitive) -->
          <!-- 
          <button class="delete-btn btn-icon-action u-text-error" data-id="${p.id}" title="Excluir">
            <span class="material-symbols-outlined" style="font-size: 1.25rem;">delete</span>
          </button>
          -->
        </td>
      </tr>
    `,
    )
    .join("");

  // Attach events
  tbody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number((btn as HTMLElement).dataset.id);
      openModal(id);
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById(
    "search-input",
  ) as HTMLInputElement;
  let timeout: any;

  searchInput?.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      loadPatients(searchInput.value);
    }, 500);
  });
}

function setupPagination() {
  // Simple placeholders if backend pagination updates
}

/* --- Modal Logic --- */
function setupModal() {
  const modal = document.getElementById("patient-modal");
  const form = document.getElementById("patient-form") as HTMLFormElement;
  const addBtn = document.getElementById("add-patient-btn");
  const closeBtns = modal?.querySelectorAll(".close-modal-btn");

  if (!modal) return;

  const toggleModal = (show: boolean) => {
    modal.classList.toggle("hidden", !show);
    // modal.classList.toggle("flex", show); // Removed Tailwind dependency
    if (!show) {
      form.reset();
      const historySection = document.getElementById("history-section");
      if (historySection) historySection.classList.add("hidden");
    }
  };

  addBtn?.addEventListener("click", () => openModal());

  closeBtns?.forEach((b) =>
    b.addEventListener("click", () => toggleModal(false)),
  );
  modal.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(false);
  });

  // Password Logic
  const passwordSection = document.getElementById("password-section");
  const passwordInput = document.getElementById(
    "generated-password",
  ) as HTMLInputElement;
  const generateBtn = document.getElementById("generate-password-btn");
  const copyBtn = document.getElementById("copy-password-btn");

  generateBtn?.addEventListener("click", () => {
    const pwd = generateStrongPassword();
    if (passwordInput) passwordInput.value = pwd;
  });

  copyBtn?.addEventListener("click", () => {
    if (passwordInput && passwordInput.value) {
      navigator.clipboard.writeText(passwordInput.value);
      uiStore.addToast("success", "Senha copiada!");
    }
  });

  // Masking
  const cpfInput = document.getElementById("patient-cpf") as HTMLInputElement;
  const phoneInput = document.getElementById(
    "patient-phone",
  ) as HTMLInputElement;

  if (cpfInput) {
    cpfInput.addEventListener("input", (e) => {
      let v = (e.target as HTMLInputElement).value.replace(/\D/g, "");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      (e.target as HTMLInputElement).value = v;
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      let v = (e.target as HTMLInputElement).value.replace(/\D/g, "");
      v = v.replace(/^(\d{2})(\d)/, "($1) $2");
      v = v.replace(/(\d{5})(\d)/, "$1-$2");
      (e.target as HTMLInputElement).value = v;
    });
  }

  // Submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const id = formData.get("id") ? Number(formData.get("id")) : null;

    const cleanCpf = (formData.get("cpf") as string).replace(/\D/g, "");
    const phone = formData.get("phone") as string;

    const password = formData.get("password") as string;

    // Construct payload with only necessary fields
    const payload: any = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      cpf: cleanCpf,
      phone: phone,
    };

    if (password && password.trim() !== "") {
      payload.password = password;
    }

    uiStore.addToast("info", "Salvando...");

    let response;
    if (id) {
      // Update: Do not send role (causes 403)
      response = await updatePatient(id, payload);
    } else {
      // Create: Role is required
      payload.role = "patient";
      response = await createPatient(payload);
    }

    if (response.success) {
      uiStore.addToast("success", "Salvo com sucesso!");
      toggleModal(false);
      loadPatients(
        (document.getElementById("search-input") as HTMLInputElement).value,
      );
    } else {
      uiStore.addToast("error", response.error?.message || "Erro ao salvar");
    }
  });
}

async function openModal(id: number | null = null) {
  const modal = document.getElementById("patient-modal");
  const form = document.getElementById("patient-form") as HTMLFormElement;
  const title = document.getElementById("modal-title");
  const historySection = document.getElementById("history-section");
  const historyList = document.getElementById("appointments-history");
  const passwordSection = document.getElementById("password-section");

  if (!modal || !form) return;

  form.reset();
  (document.getElementById("patient-id") as HTMLInputElement).value = "";

  if (id) {
    if (title) title.textContent = "Editar Paciente";
    if (passwordSection) passwordSection.classList.add("hidden");
    uiStore.addToast("info", "Carregando dados...");

    // Fetch user details
    // We can use getPatient or find in currentPatients list if sufficient
    // Better fetch fresh to get full details if needed
    const response = await getPatient(id);
    if (response.success && response.data) {
      const p = response.data;
      (document.getElementById("patient-id") as HTMLInputElement).value =
        String(p.id);
      (document.getElementById("patient-name") as HTMLInputElement).value =
        p.name;
      (document.getElementById("patient-email") as HTMLInputElement).value =
        p.email;

      // Mask CPF
      // assuming backend returns clean CPF
      if (p.cpf) {
        let v = p.cpf.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        (document.getElementById("patient-cpf") as HTMLInputElement).value = v;
      }

      // Phone is usually returned formatted if we sent it formatted, but check
      if (p.phone) {
        (document.getElementById("patient-phone") as HTMLInputElement).value =
          p.phone;
      }

      // Load History
      if (historySection && historyList) {
        historySection.classList.remove("hidden");
        historyList.innerHTML =
          '<p class="text-xs text-slate-500">Carregando histórico...</p>';

        const aptResponse = await listAppointments({
          patientId: id,
          pageSize: 5,
        });
        if (aptResponse.success && aptResponse.data) {
          const appts = Array.isArray(aptResponse.data)
            ? aptResponse.data
            : aptResponse.data.appointments;

          if (appts.length === 0) {
            historyList.innerHTML =
              '<p class="text-xs text-slate-500">Nenhum agendamento encontrado.</p>';
          } else {
            historyList.innerHTML = appts
              .map(
                (a) => `
                        <div class="u-flex u-justify-between u-items-center u-padding-medium u-mb-05" style="border: 1px solid var(--border-dark); border-radius: 0.5rem; background-color: var(--background-dark);">
                            <div>
                                <p class="u-fw-700 u-fs-xs u-text-secondary">${a.date} - ${a.time}</p>
                                <p class="u-fs-xs u-text-secondary" style="font-size: 10px;">Dr. ${a.professional_name}</p>
                            </div>
                            <span class="u-fs-xs u-uppercase" style="background-color: #334155; padding: 2px 6px; border-radius: 4px; color: #cbd5e1; font-size: 10px;">${a.status}</span>
                        </div>
                     `,
              )
              .join("");
          }
        } else {
          historyList.innerHTML =
            '<p class="helper-text u-text-error">Erro ao carregar histórico</p>';
        }
      }
    } else {
      uiStore.addToast("error", "Erro ao carregar paciente");
      return;
    }
  } else {
    if (title) title.textContent = "Novo Paciente";
    if (historySection) historySection.classList.add("hidden");
    if (passwordSection) {
      passwordSection.classList.remove("hidden");
      // Auto generate on open new? Or let user click? Let user click to be explicit.
      (
        document.getElementById("generated-password") as HTMLInputElement
      ).value = "";
    }
  }

  modal.classList.remove("hidden");
  // modal.classList.add("flex"); // Removed Tailwind dependency
}

function generateStrongPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPatientsPage);
} else {
  initPatientsPage();
}
