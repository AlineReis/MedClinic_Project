/**
 * DASHBOARD.JS
 * Logic for the Admin Dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardMetrics();
    loadRecentSplits();
});

function loadDashboardMetrics() {
    const appointments = window.db.getAppointments();
    const doctors = window.db.getDoctors();
    const patients = window.db.getPatients(); // Assuming this getter exists or we added it

    // 1. Revenue
    const totalRevenue = appointments
        .filter(a => a.status !== 'cancelled')
        .reduce((sum, a) => sum + (a.price || 0), 0);

    // 2. Counts
    const apptCount = appointments.length;
    const patientCount = patients.length;
    const doctorCount = doctors.length;

    // Render
    document.getElementById('kpi-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('kpi-appointments').textContent = apptCount;
    document.getElementById('kpi-patients').textContent = patientCount;
    document.getElementById('kpi-doctors').textContent = doctorCount;
}

function loadRecentSplits() {
    const list = document.getElementById('split-list');
    const appointments = window.db.getAppointments().slice(-5).reverse(); // Last 5

    if (appointments.length === 0) {
        list.innerHTML = `<p class="text-slate-500 text-sm italic">Nenhuma transação recente.</p>`;
        return;
    }

    list.innerHTML = appointments.map(appt => {
        // Mock Split Calculation: 80% Doctor, 20% Clinic
        const value = appt.price || 0;
        const splitDoc = value * 0.8;
        const splitClinic = value * 0.2;

        return `
            <div class="flex items-center justify-between p-3 rounded-lg bg-[#111418] border border-[#293038]">
                <div class="flex items-center gap-3">
                    <div class="size-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                         <span class="material-symbols-outlined text-sm">attach_money</span>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400">Ref: #${appt.id.toString().slice(-4)}</p>
                        <p class="text-sm font-bold text-white">${appt.professional_name.split(' ')[0]}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold text-white">${formatCurrency(splitDoc)}</p>
                    <p class="text-[10px] text-slate-500">Taxa: ${formatCurrency(splitClinic)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
