/**
 * APPOINTMENTS.JS
 * Logic for displaying user appointments.
 */

document.addEventListener('DOMContentLoaded', () => {
    renderAppointments();
});

function renderAppointments() {
    const list = document.getElementById('appointments-list');
    const appointments = window.db.getAppointments().reverse(); // Show newest first

    if (appointments.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-center bg-surface-dark border border-border-dark rounded-xl">
                <span class="material-symbols-outlined text-4xl text-text-secondary mb-4">event_busy</span>
                <h3 class="text-lg font-bold text-white">Nenhum agendamento</h3>
                <p class="text-text-secondary mb-6">Você ainda não tem consultas agendadas.</p>
                <a href="index.html" class="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Agendar Agora
                </a>
            </div>
        `;
        return;
    }

    list.innerHTML = appointments.map(apt => `
        <div class="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start relative overflow-hidden">
            <!-- Status Stripe -->
            <div class="absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(apt.status)}"></div>
            
            <div class="flex-1 w-full">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-white">${apt.professional_name}</h3>
                    <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusBadge(apt.status)}">
                        ${getStatusLabel(apt.status)}
                    </span>
                </div>
                <p class="text-primary text-sm font-medium mb-4">${apt.specialty}</p>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-text-secondary">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">calendar_month</span>
                        ${apt.date}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">schedule</span>
                        ${apt.time}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">location_on</span>
                        Unidade ${apt.location}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">attach_money</span>
                        R$ ${apt.price.toFixed(2)}
                    </div>
                </div>
            </div>

            <div class="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                 <button class="flex-1 md:flex-none border border-border-dark hover:bg-white/5 text-text-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Detalhes
                </button>
                ${apt.status === 'scheduled' ? `
                    <button class="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Cancelar
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const map = {
        'scheduled': 'bg-green-500',
        'cancelled': 'bg-red-500',
        'completed': 'bg-blue-500'
    };
    return map[status] || 'bg-slate-500';
}

function getStatusBadge(status) {
    const map = {
        'scheduled': 'bg-green-500/10 text-green-500 border border-green-500/20',
        'cancelled': 'bg-red-500/10 text-red-500 border border-red-500/20',
        'completed': 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
    };
    return map[status] || 'bg-slate-800 text-slate-400 border border-slate-700';
}

function getStatusLabel(status) {
    const map = {
        'scheduled': 'Agendado',
        'cancelled': 'Cancelado',
        'completed': 'Realizado'
    };
    return map[status] || status;
}
