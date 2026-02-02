
import { authStore } from "../stores/authStore";
import { listAppointments } from "../services/appointmentsService";
import type { AppointmentSummary } from "../types/appointments";
import { formatCurrency } from "../utils/formatters";

document.addEventListener("DOMContentLoaded", () => {
    initManagerDashboard();
});

async function initManagerDashboard() {
    let session = authStore.getSession();

    if (!session) {
        session = await authStore.refreshSession();
    }
    
    // Auth Check
    if (!session || (session.role !== 'clinic_admin' && session.role !== 'system_admin')) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Fetch and Render
    await loadDashboardStats();
    await loadSystemAlerts();
    
    // Print Button
    document.getElementById('btn-export-report')?.addEventListener('click', printReport);
}

// Global variable to store splits for export
let currentSplitsData: { name: string, count: number, amount: number, specialty: string }[] = [];

async function loadDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
        const response = await listAppointments({
            startDate: startOfMonth,
            endDate: endOfMonth,
            pageSize: 1000 
        });

        if (response.success && response.data) {
            calculateAndRenderStats(response.data.appointments);
        }
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}

function calculateAndRenderStats(appointments: AppointmentSummary[]) {
    // 1. Consultas
    const totalAppointments = appointments.length;
    updateStat('appointments-count', totalAppointments.toString());

    // 2. Faturamento
    const completedApps = appointments.filter(a => a.status === 'completed');
    const totalRevenue = completedApps.reduce((acc, curr) => acc + (curr.price || 0), 0);
    updateStat('revenue', formatCurrency(totalRevenue));

    // 3. Comissões (60%)
    const totalCommissions = totalRevenue * 0.60;
    updateStat('pending-transfers', formatCurrency(totalCommissions));

    // 4. No-Show
    const noShowCount = appointments.filter(a => a.status === 'no_show').length;
    const noShowRate = totalAppointments > 0 
        ? ((noShowCount / totalAppointments) * 100).toFixed(1) 
        : "0.0";
    
    updateStat('noshow-rate', `${noShowRate}%`);
    
    // 5. Render Splits List
    renderSplitsList(completedApps);
}

function renderSplitsList(completedApps: AppointmentSummary[]) {
    const listContainer = document.querySelector('[data-split-list]');
    if (!listContainer) return;

    const splitsByProfessional = new Map<string, { count: number, amount: number, specialty: string }>();

    completedApps.forEach(app => {
        const name = app.professional_name || "Desconhecido";
        const current = splitsByProfessional.get(name) || { count: 0, amount: 0, specialty: app.specialty || "Geral" };
        
        current.count++;
        current.amount += (app.price || 0) * 0.60;
        
        splitsByProfessional.set(name, current);
    });

    // Update global for export
    currentSplitsData = Array.from(splitsByProfessional.entries()).map(([name, data]) => ({
        name,
        ...data
    }));

    if (splitsByProfessional.size === 0) {
        listContainer.innerHTML = '<p class="text-muted" style="padding: 1rem;">Nenhum repasse pendente.</p>';
        return;
    }

    let html = '';
    splitsByProfessional.forEach((data, name) => {
        html += `
            <div class="split-item">
                <div class="split-item-info">
                    <p class="split-item-name">${name}</p>
                    <p class="split-item-meta">${data.specialty} • ${data.count} consultas</p>
                </div>
                <span class="split-item-amount">${formatCurrency(data.amount)}</span>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function updateStat(key: string, value: string) {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = value;
}

async function loadSystemAlerts() {
    // 1. Refunds (Mock logic compatible with real filters)
    // We check for cancelled appointments that MIGHT need refund (e.g. recent cancellations)
    // Since we don't have 'payment_status' filter in simple list, we fetch recent cancelled
    try {
        // Fetch both cancellation types
        const response = await listAppointments({ 
            status: ['cancelled_by_clinic', 'cancelled_by_patient'], 
            pageSize: 100 
        });
        
        const refundCount = response.data?.appointments.length || 0;
        
        const refundTitle = document.querySelector('.alert-title--error');
        if (refundTitle) {
            refundTitle.textContent = `${refundCount} Cancelamentos Recentes`;
        }
        
    } catch (e) { console.error(e); }

    // 2. Report Deadline
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = lastDay - today.getDate();
    
    const reportSubtitle = document.querySelector('.alert-title--warning + .alert-subtitle');
    if (reportSubtitle) {
        reportSubtitle.textContent = `Prazo para fechamento: ${daysLeft} dias`;
    }
}

function printReport() {
    if (currentSplitsData.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }

    const printContent = `
        <html>
        <head>
            <title>Relatório de Repasses - MediLux</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                .meta { margin-bottom: 20px; color: #7f8c8d; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #bdc3c7; padding: 12px; text-align: left; }
                th { background-color: #ecf0f1; color: #2c3e50; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .total-row { font-weight: bold; background-color: #e8f6f3; }
                .footer { margin-top: 40px; font-size: 0.8rem; text-align: center; color: #bdc3c7; }
            </style>
        </head>
        <body>
            <h1>Relatório de Repasses Médicos</h1>
            <div class="meta">
                <p><strong>Clínica:</strong> MediLux Clinic</p>
                <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
                <p><strong>Referência:</strong> Mês Atual</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Profissional</th>
                        <th>Especialidade</th>
                        <th style="text-align: center;">Qtd. Consultas</th>
                        <th style="text-align: right;">Valor Repasse (60%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentSplitsData.map(d => `
                        <tr>
                            <td>${d.name}</td>
                            <td>${d.specialty}</td>
                            <td style="text-align: center;">${d.count}</td>
                            <td style="text-align: right;">${formatCurrency(d.amount)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="2">TOTAL GERAL</td>
                        <td style="text-align: center;">${currentSplitsData.reduce((acc, curr) => acc + curr.count, 0)}</td>
                        <td style="text-align: right;">${formatCurrency(currentSplitsData.reduce((acc, curr) => acc + curr.amount, 0))}</td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                Relatório gerado automaticamente pelo Sistema MediLux Manager.
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    } else {
        alert("Por favor, permita pop-ups para imprimir o relatório.");
    }
}
