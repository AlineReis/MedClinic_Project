
import { authStore } from "../stores/authStore";
import { formatCurrency } from "../utils/formatters";
import { listAppointments } from "../services/appointmentsService";
// import { getProfessionalCommissions } from "../services/professionalsService"; // Can be added later if backend endpoint is ready

document.addEventListener("DOMContentLoaded", () => {
    initFinancialPage();
});

async function initFinancialPage() {
    let session = authStore.getSession();

    if (!session) {
        session = await authStore.refreshSession();
    }

    if (!session || (session.role !== 'clinic_admin' && session.role !== 'system_admin')) {
        window.location.href = '../pages/login.html';
        return;
    }

    await loadFinancialData();
}

async function loadFinancialData() {
    // Determine current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
        // Fetch all appointments for the month to calculate aggregates
        const response = await listAppointments({
            startDate: startOfMonth,
            endDate: endOfMonth,
            pageSize: 2000,
            status: 'completed' 
        });

        if (response.success && response.data) {
            calculateFinancialStats(response.data.appointments);
            renderTransactionsTable(response.data.appointments);
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
    const toProfessionals = revenue * 0.60;
    const taxes = revenue * 0.05;
    const netProfit = revenue - toProfessionals - taxes;

    updateStat('revenue', formatCurrency(revenue));
    updateStat('transfers', formatCurrency(toProfessionals));
    updateStat('taxes', formatCurrency(taxes));
    updateStat('profit', formatCurrency(netProfit));
}

function updateStat(id: string, value: string) {
    const el = document.getElementById(`kpi-${id}`); // Verify IDs in HTML match this
    if (el) el.textContent = value;
    else {
        // Fallback for different HTML structure
        const el2 = document.querySelector(`[data-stat="${id}"]`);
        if (el2) el2.textContent = value;
    }
}

function renderTransactionsTable(appointments: any[]) {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma transação encontrada.</td></tr>';
        return;
    }

    // Show last 10 transactions
    const recent = appointments.slice(0, 10);

    tbody.innerHTML = recent.map(app => `
        <tr>
            <td>
                <div class="user-info-row">
                    <div class="user-profile-data">
                        <p class="user-name">${app.patient_name || 'Paciente'}</p>
                        <p class="user-id">${app.date} • ${app.time}</p>
                    </div>
                </div>
            </td>
            <td>${formatCurrency(app.price || 0)}</td>
            <td>
                <span class="transaction-status status-liquidated">LIQUIDADO</span>
            </td>
        </tr>
    `).join('');
}
