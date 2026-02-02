
import { authStore } from "../stores/authStore";
import { listAppointments } from "../services/appointmentsService";
import "../config/theme"; // Theme toggle support
import Chart from 'chart.js/auto';

document.addEventListener("DOMContentLoaded", () => {
    initManagerDashboard();
});

async function initManagerDashboard() {
    let session = authStore.getSession();

    if (!session) {
        session = await authStore.refreshSession();
    }

    if (!session || (session.role !== 'clinic_admin' && session.role !== 'system_admin')) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Set Dashboard Date
    const dateEl = document.querySelector('.manager-header-subtitle');
    if (dateEl) {
        const now = new Date();
        const month = now.toLocaleString('pt-BR', { month: 'long' });
        const year = now.getFullYear();
        dateEl.textContent = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }

    await loadOperationalData();
}

let chartSpecialties: Chart | null = null;
let chartPeakHours: Chart | null = null;

async function loadOperationalData() {
    const now = new Date();
    
    // 1. Data for "Today" (KPIs + Next Patients)
    const todayStr = now.toISOString().split('T')[0];
    const todayResponse = await listAppointments({
        startDate: todayStr,
        endDate: todayStr,
        pageSize: 1000 // Get all for today
    });

    // 2. Data for "Month" (Charts + Unique Patients)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const monthResponse = await listAppointments({
        startDate: startOfMonth,
        endDate: endOfMonth,
        pageSize: 2000
    });

    if (todayResponse.success && todayResponse.data) {
        updateTodayKPIs(todayResponse.data.appointments);
        renderNextPatients(todayResponse.data.appointments);
    }

    if (monthResponse.success && monthResponse.data) {
        updateMonthKPIs(monthResponse.data.appointments);
        renderCharts(monthResponse.data.appointments);
    }
}

function updateTodayKPIs(appointments: any[]) {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const pending = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const inProgress = appointments.filter(a => a.status === 'in_progress').length;

    setText('kpi-today-count', total.toString());
    setText('kpi-completed-count', completed.toString());
    
    // Status Text
    const statusEl = document.getElementById('kpi-today-status');
    if (statusEl) {
        statusEl.innerHTML = `${pending} Pendentes <span style="margin: 0 4px">•</span> ${inProgress} Em Andamento`;
    }
}

function updateMonthKPIs(appointments: any[]) {
    // Unique Patients
    const uniquePatients = new Set(appointments.map(a => a.patient_id)).size;
    setText('kpi-active-patients', uniquePatients.toString());
}

function setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderNextPatients(appointments: any[]) {
    const listEl = document.getElementById('next-patients-list');
    if (!listEl) return;

    const now = new Date();
    // Filter: Scheduled/Confirmed/InProgress AND Time >= Now (approx) or just show all remaining for simplicty
    // Let's show all "Not Completed/Cancelled" for today, sorted by time
    const upcoming = appointments
        .filter(a => ['scheduled', 'confirmed', 'in_progress'].includes(a.status))
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 5); // Show next 5

    if (upcoming.length === 0) {
        listEl.innerHTML = `<p style="padding: 1rem; color: var(--text-secondary); text-align: center;">Nenhum paciente aguardando.</p>`;
        return;
    }

    listEl.innerHTML = upcoming.map(app => `
        <div class="split-item" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
            <div class="split-item-info">
                <p class="split-item-name">${app.patient_name}</p>
                <p class="split-item-meta">
                    ${app.time.slice(0, 5)} • ${app.professional_name.split(' ')[0]} • 
                    <span style="color: ${getStatusColor(app.status)}">${translateStatus(app.status)}</span>
                </p>
            </div>
            <div class="split-item-action">
                <button class="btn-icon-small" title="Ver Detalhes">
                    <span class="material-symbols-outlined" style="font-size: 1.2rem;">visibility</span>
                </button>
            </div>
        </div>
    `).join('');
}

function renderCharts(appointments: any[]) {
    renderSpecialtiesChart(appointments);
    renderPeakHoursChart(appointments);
}

function renderSpecialtiesChart(appointments: any[]) {
    const ctx = document.getElementById('chartSpecialties') as HTMLCanvasElement;
    if (!ctx) return;
    if (chartSpecialties) chartSpecialties.destroy();

    // Group by Specialty
    const counts: Record<string, number> = {};
    appointments.forEach(app => {
        const spec = app.specialty || 'Geral';
        counts[spec] = (counts[spec] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    // Sort by count desc
    // (Optional optimization)

    chartSpecialties = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#9ca3af', usePointStyle: true, font: { family: "'Inter', sans-serif" } }
                }
            },
            cutout: '70%'
        }
    });
}

function renderPeakHoursChart(appointments: any[]) {
    const ctx = document.getElementById('chartPeakHours') as HTMLCanvasElement;
    if (!ctx) return;
    if (chartPeakHours) chartPeakHours.destroy();

    // Group by Hour
    const hours = Array(24).fill(0);
    appointments.forEach(app => {
        if (app.time) {
            const h = parseInt(app.time.split(':')[0]);
            if (!isNaN(h) && h >= 0 && h < 24) hours[h]++;
        }
    });

    // Filter to business hours (e.g. 7h - 20h) for cleaner chart
    const businessHours = hours.slice(7, 20);
    const labels = Array.from({length: 13}, (_, i) => `${i + 7}h`);

    chartPeakHours = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consultas',
                data: businessHours,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#f3f4f6',
                    bodyColor: '#d1d5db',
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                y: { 
                    display: true,
                    beginAtZero: true,
                    grid: {
                        color: '#374151',
                        tickLength: 0
                    },
                    border: { display: false },
                    ticks: {
                        display: false // Hide numbers but keep grid lines
                    } 
                },
                x: { 
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { family: "'Inter', sans-serif" } }
                }
            }
        }
    });
}

function getStatusColor(status: string) {
    const map: Record<string, string> = {
        'scheduled': '#3b82f6',
        'confirmed': '#10b981',
        'in_progress': '#f59e0b',
        'completed': '#9ca3af',
        'cancelled': '#ef4444'
    };
    return map[status] || '#9ca3af';
}

function translateStatus(status: string) {
    const map: Record<string, string> = {
        'scheduled': 'Agendado',
        'confirmed': 'Confirmado',
        'in_progress': 'Em Andamento',
        'completed': 'Finalizado',
        'cancelled': 'Cancelado'
    };
    return map[status] || status;
}
