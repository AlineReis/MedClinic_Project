import { authStore } from "../stores/authStore";
import { formatCurrency } from "../utils/formatters";
import { listAppointments } from "../services/appointmentsService";
import { sendFinancialReportEmail } from "../services/reportsService";
import { uiStore } from "../stores/uiStore";
import "../config/theme"; // Enable Theme Toggle
import Chart from "chart.js/auto";

document.addEventListener("DOMContentLoaded", () => {
  initFinancialPage();
});

async function initFinancialPage() {
  let session = authStore.getSession();

  if (!session) {
    session = await authStore.refreshSession();
  }

  if (
    !session ||
    (session.role !== "clinic_admin" && session.role !== "system_admin")
  ) {
    window.location.href = "../pages/login.html";
    return;
  }

  await loadFinancialData();
}

// State
let currentAppointments: any[] = [];
let filteredAppointments: any[] = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const filters = {
  search: "",
  startDate: "",
  endDate: "",
  sortBy: "date_desc",
};

async function loadFinancialData() {
  // Determine current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  try {
    // Fetch all appointments for the month to calculate aggregates
    const response = await listAppointments({
      startDate: startOfMonth,
      endDate: endOfMonth,
      pageSize: 2000,
      status: "completed",
    });

    if (response.success && response.data) {
      currentAppointments = response.data.appointments;
      // Init filters with all data
      filteredAppointments = [...currentAppointments];

      calculateFinancialStats(currentAppointments);
      renderFinancialChart(currentAppointments);

      setupFilters(); // Attach listeners
      applyFilters(); // Initial sort/filter apply -> calls renderTransactionsTable
      setupPaginationListeners();
    } else {
      console.error("Failed to load appointments for financial view");
    }
  } catch (error) {
    console.error("Error loading financial data:", error);
  }
}

function calculateFinancialStats(appointments: any[]) {
  // Total Revenue
  const revenue = appointments.reduce((sum, app) => sum + (app.price || 0), 0);

  // Splits Logic
  const toProfessionals = revenue * 0.6;
  const taxes = revenue * 0.05;
  const netProfit = revenue - toProfessionals - taxes;

  updateStat("revenue", formatCurrency(revenue));
  updateStat("transfers", formatCurrency(toProfessionals));
  updateStat("taxes", formatCurrency(taxes));
  updateStat("profit", formatCurrency(netProfit));
}

function updateStat(id: string, value: string) {
  const el = document.getElementById(`kpi-${id}`);
  if (el) el.textContent = value;
  else {
    const el2 = document.querySelector(`[data-stat="${id}"]`);
    if (el2) el2.textContent = value;
  }
}

// Global reference to chart instance to allow destruction
let chartInstance: Chart | null = null;

function renderFinancialChart(appointments: any[]) {
  // 1. Calculate Date Ranges (Current Month)
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const fmtM = month.toString().padStart(2, "0");

  const defaultLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"];
  const dateLabels = [
    `01/${fmtM} - 07/${fmtM}`,
    `08/${fmtM} - 14/${fmtM}`,
    `15/${fmtM} - 21/${fmtM}`,
    `22/${fmtM} - 28/${fmtM}`,
    `29/${fmtM} - ${lastDayOfMonth}/${fmtM}`,
  ];

  // 2. Process Data
  const grossData = [0, 0, 0, 0, 0];
  const netData = [0, 0, 0, 0, 0];

  appointments.forEach((app) => {
    const date = new Date(app.date);
    const day = date.getDate();
    const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);

    const price = app.price || 0;
    grossData[weekIdx] += price;
    netData[weekIdx] += price * 0.35; // 35% Net for clinic
  });

  const ctx = document.getElementById("financialChart") as HTMLCanvasElement;
  if (!ctx) return;

  if (chartInstance) chartInstance.destroy();

  // Config Colors
  const colorPrimary = "#3b82f6";
  const colorPrimaryAlpha = "rgba(59, 130, 246, 0.5)";
  const colorTeal = "#10b981";

  // Create Chart
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...defaultLabels],
      datasets: [
        {
          label: "Bruto (Consolidado)",
          data: grossData,
          backgroundColor: colorPrimaryAlpha,
          borderColor: colorPrimary,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
        {
          label: "Líquido (Profit)",
          data: netData,
          backgroundColor: colorTeal,
          borderColor: colorTeal,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (e, activeElements, chart) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const currentLabels = chart.data.labels;

          if (currentLabels && currentLabels[index] === defaultLabels[index]) {
            currentLabels[index] = dateLabels[index];
          } else if (currentLabels) {
            currentLabels[index] = defaultLabels[index];
          }
          chart.update();
        }
      },
      interaction: {
        mode: "nearest",
        intersect: true,
        axis: "x",
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#9ca3af",
            usePointStyle: true,
            font: { family: "'Inter', sans-serif", size: 12 },
          },
        },
        tooltip: {
          backgroundColor: "#1f2937",
          titleColor: "#f3f4f6",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: function (context) {
              const idx = context[0].dataIndex;
              return dateLabels[idx];
            },
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null)
                label += formatCurrency(context.parsed.y);
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#374151", tickLength: 0 },
          ticks: {
            color: "#9ca3af",
            font: { family: "'Inter', sans-serif", size: 11 },
            callback: function (value) {
              if (typeof value === "number" && value >= 1000)
                return "R$ " + (value / 1000).toFixed(1) + "k";
              return "R$ " + value;
            },
          },
          border: { display: false },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: "#9ca3af",
            font: { family: "'Inter', sans-serif", size: 11 },
          },
        },
      },
    },
  });
}

// --- Filters & Sorting ---

function setupFilters() {
  const searchInput = document.getElementById(
    "filter-search",
  ) as HTMLInputElement;
  const sortSelect = document.getElementById(
    "filter-sort",
  ) as HTMLSelectElement;
  const startDateInput = document.getElementById(
    "filter-start-date",
  ) as HTMLInputElement;
  const endDateInput = document.getElementById(
    "filter-end-date",
  ) as HTMLInputElement;

  const apply = () => {
    filters.search = searchInput?.value.toLowerCase() || "";
    filters.sortBy = sortSelect?.value || "date_desc";
    filters.startDate = startDateInput?.value || "";
    filters.endDate = endDateInput?.value || "";
    applyFilters();
  };

  searchInput?.addEventListener("input", apply);
  sortSelect?.addEventListener("change", apply);
  startDateInput?.addEventListener("change", apply);
  endDateInput?.addEventListener("change", apply);

  // Export Dropdown Logic
  const exportTrigger = document.getElementById("btn-export-trigger");
  const exportMenu = document.getElementById("export-menu");
  const optCsv = document.getElementById("opt-csv");
  const optPdf = document.getElementById("opt-pdf");
  const optEmail = document.getElementById("opt-email");

  // Toggle Menu
  exportTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    exportMenu?.classList.toggle("is-hidden");
  });

  // Close on click outside
  document.addEventListener("click", () => {
    if (!exportMenu?.classList.contains("is-hidden")) {
      exportMenu?.classList.add("is-hidden");
    }
  });

  // Options
  optCsv?.addEventListener("click", () => {
    exportToCSV();
    exportMenu?.classList.add("is-hidden");
  });

  optPdf?.addEventListener("click", () => {
    printReport();
    exportMenu?.classList.add("is-hidden");
  });

  optEmail?.addEventListener("click", async () => {
    exportMenu?.classList.add("is-hidden");
    uiStore.addToast("info", "Preparando envio de relatório...");

    // Generate HTML for the report (same as Print)
    const reportHtml = generateReportHTML();

    // Pass current filters and HTML
    const response = await sendFinancialReportEmail(
      filters.startDate,
      filters.endDate,
      reportHtml,
    );
    if (response.success) {
      uiStore.addToast("success", "Relatório enviado por email!");
    } else {
      uiStore.addToast(
        "error",
        response.error?.message || "Erro ao enviar relatório.",
      );
    }
  });
}

function exportToCSV() {
  if (filteredAppointments.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // CSV Header (Semicolon for Excel)
  const headers = [
    "Data",
    "Hora",
    "Paciente",
    "Profissional",
    "Especialidade",
    "Status",
    "Valor (R$)",
  ];

  // CSV Rows
  const rows = filteredAppointments.map((app) => {
    return [
      new Date(app.date).toLocaleDateString("pt-BR"),
      app.time,
      app.patient_name || "Paciente",
      app.professional_name || "Indefinido",
      app.specialty || "-",
      app.status,
      (app.price || 0).toFixed(2).replace(".", ","),
    ]
      .map((field) => `"${field}"`)
      .join(";"); // Quote fields + Semicolon
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n"); // Add BOM

  // Download Blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `relatorio_financeiro_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printReport() {
  if (filteredAppointments.length === 0) {
    alert("Não há dados para imprimir.");
    return;
  }

  // Create a hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const content = generateReportHTML();

  doc.open();
  doc.write(content);
  doc.close();

  // Print and Remove
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 500);
}

function generateReportHTML(): string {
  // Calculate Totals for Summary
  const total = filteredAppointments.reduce(
    (sum, app) => sum + (app.price || 0),
    0,
  );

  // Build HTML Template
  return `
        <html>
        <head>
            <title>Relatório Financeiro</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                .header h1 { margin: 0; color: #1e293b; font-size: 24px; }
                .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
                
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                tr:nth-child(even) { background-color: #f8fafc; }
                
                .summary { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório Financeiro</h1>
                <p>MedClinic • Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Paciente</th>
                        <th>Profissional</th>
                        <th>Serviço</th>
                        <th>Status</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredAppointments
                      .map(
                        (app) => `
                        <tr>
                            <td>${new Date(app.date).toLocaleDateString("pt-BR")} ${app.time}</td>
                            <td>${app.patient_name || "Paciente"}</td>
                            <td>${app.professional_name || "-"}</td>
                            <td>${app.specialty || "-"}</td>
                            <td>${app.status.toUpperCase()}</td>
                            <td>${formatCurrency(app.price || 0)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="summary">
                Total do Período: ${formatCurrency(total)}
            </div>

            <div class="footer">
                Relatório confidencial gerado pelo sistema MedClinic.
            </div>
        </body>
        </html>
    `;
}

function applyFilters() {
  filteredAppointments = currentAppointments.filter((app) => {
    // Search (Patient Name)
    if (
      filters.search &&
      !app.patient_name.toLowerCase().includes(filters.search)
    ) {
      return false;
    }
    // Date Range
    if (filters.startDate && app.date < filters.startDate) return false;
    if (filters.endDate && app.date > filters.endDate) return false;

    return true;
  });

  // Sort
  filteredAppointments.sort((a, b) => {
    switch (filters.sortBy) {
      case "date_asc":
        return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
      case "date_desc":
        return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
      case "price_asc":
        return (a.price || 0) - (b.price || 0);
      case "price_desc":
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  // Reset pagination and render
  currentPage = 1;
  renderTransactionsTable();
}

function renderTransactionsTable() {
  const tbody = document.querySelector(".admin-table tbody");
  const prevBtn = document.getElementById("btn-prev-page") as HTMLButtonElement;
  const nextBtn = document.getElementById("btn-next-page") as HTMLButtonElement;
  const infoSpan = document.querySelector(".pagination-info");

  if (!tbody) return;

  if (filteredAppointments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center" style="padding: 2rem; color: var(--text-secondary);">Nenhuma transação encontrada.</td></tr>';
    if (infoSpan) infoSpan.textContent = "Mostrando 0-0 de 0";
    return;
  }

  // Pagination Logic
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(
    startIdx + ITEMS_PER_PAGE,
    filteredAppointments.length,
  );
  const pageItems = filteredAppointments.slice(startIdx, endIdx);

  // Update Controls
  if (infoSpan)
    infoSpan.textContent = `Mostrando ${startIdx + 1}-${endIdx} de ${filteredAppointments.length}`;
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  tbody.innerHTML = pageItems
    .map(
      (app) => `
        <tr>
            <td>
                <div class="user-info-row">
                    <div class="user-profile-data">
                        <p class="user-name">${app.patient_name || "Paciente"}</p>
                        <p class="user-id">${new Date(app.date).toLocaleDateString()} • ${app.time.slice(0, 5)}</p>
                    </div>
                </div>
            </td>
            <td>
                <span style="font-weight: 500; color: var(--text-primary);">${app.professional_name || "Indefinido"}</span>
                <br>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${app.specialty || "-"}</span>
            </td>
            <td>${formatCurrency(app.price || 0)}</td>
            <td>
                <span class="transaction-status status-liquidated">LIQUIDADO</span>
            </td>
        </tr>
    `,
    )
    .join("");
}

function setupPaginationListeners() {
  document.getElementById("btn-prev-page")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTransactionsTable();
    }
  });

  document.getElementById("btn-next-page")?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderTransactionsTable();
    }
  });
}
