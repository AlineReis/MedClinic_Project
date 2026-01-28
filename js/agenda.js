/**
 * AGENDA.JS
 * Logic for the Calendar/Agenda view.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAgenda();
});

const HOURS = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const SLOT_HEIGHT = 96; // px per hour (matches bg-size in CSS)

function initAgenda() {
    renderHeaders();
    renderTimeColumn();
    renderGrid();
}

/**
 * Renders the top row with doctor profiles.
 */
function renderHeaders() {
    const container = document.getElementById('calendar-header-doctors');
    const doctors = window.db.getDoctors();

    // Create a container for doc headers to ensure they align with grid columns
    const docList = document.createElement('div');
    docList.className = 'flex flex-1';

    docList.innerHTML = doctors.map(doc => `
        <div class="flex-1 min-w-[240px] border-r border-border-dark p-3 flex items-center gap-3 hover:bg-slate-800/30 transition-colors cursor-pointer group">
            <div class="relative">
                <div class="size-11 rounded-full bg-cover bg-center ring-2 ring-primary/30 group-hover:ring-primary transition-all" 
                     style="background-image: url('${doc.image}');"></div>
                <div class="absolute -bottom-1 -right-1 bg-surface-dark rounded-full p-0.5 border border-border-dark">
                    <div class="size-2.5 rounded-full bg-emerald-500"></div>
                </div>
            </div>
            <div>
                <p class="font-bold text-sm text-white leading-tight">${doc.name}</p>
                <p class="text-xs text-primary font-medium mt-0.5">${doc.specialty}</p>
            </div>
        </div>
    `).join('');

    container.appendChild(docList);
}

/**
 * Renders the left sidebar with times.
 */
function renderTimeColumn() {
    const container = document.getElementById('calendar-time-column');

    container.innerHTML = HOURS.map(hour => `
        <div class="h-[96px] border-b border-border-dark/50 flex items-start justify-center pt-2 relative">
            ${hour}
            <div class="absolute right-0 top-0 w-1.5 h-[1px] bg-border-dark"></div>
        </div>
    `).join('');
}

/**
 * Renders the main grid columns and places appointments.
 */
function renderGrid() {
    const container = document.getElementById('calendar-grid');
    const doctors = window.db.getDoctors();
    const appointments = window.db.getAppointments();

    const todayStr = new Date().toLocaleDateString('pt-BR');

    container.innerHTML += doctors.map(doc => {
        // Filter appointments for this doctor and today (mock: showing all for today for simplicity)
        const docAppts = appointments.filter(a => a.professional_id == doc.id && a.date === todayStr);

        // Generate ID for column
        const colId = `col-doc-${doc.id}`;

        // Generate appointment cards
        const cardsHtml = docAppts.map(apt => {
            const topPosition = calculateTopPosition(apt.time);
            return `
                <div class="absolute left-2 right-2 h-[80px] rounded-lg bg-emerald-500/10 border-l-[3px] border-l-emerald-500 border-y border-r border-emerald-500/20 p-2.5 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer z-10"
                     style="top: ${topPosition}px;">
                    <div class="flex justify-between items-start">
                        <h4 class="text-white font-bold text-sm truncate">Paciente Mock</h4>
                        <span class="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
                    </div>
                    <div class="flex items-center justify-between text-xs mt-1">
                        <p class="text-emerald-200/80 truncate font-medium">${apt.specialty}</p>
                        <span class="text-slate-400 font-mono">${apt.time}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="flex-1 min-w-[240px] border-r border-border-dark relative p-1 group/col" id="${colId}">
                <!-- Ghost slots or interactions could go here -->
                ${cardsHtml}
            </div>
        `;
    }).join('');
}

/**
 * Helper to calculate pixel position from time string (e.g., "14:30").
 * Base hour is 08:00 (0px).
 */
function calculateTopPosition(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);

    const startHour = 8;
    const totalMinutesFromStart = ((hours - startHour) * 60) + minutes;

    // 96px = 60 minutes => 1.6 px per minute
    const pxPerMinute = SLOT_HEIGHT / 60;

    return totalMinutesFromStart * pxPerMinute;
}
