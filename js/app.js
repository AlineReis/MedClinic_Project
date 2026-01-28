/**
 * APP.JS
 * Main application logic for the Patient Portal.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Check if database is initialized
    if (!window.db) {
        console.error("Database not initialized");
        return;
    }

    renderFilters();
    renderDoctors(window.db.getDoctors());
    setupEventListeners();
}

/**
 * Renders the filter sidebar dynamically based on available data.
 */
function renderFilters() {
    const container = document.getElementById('filters-container');
    const doctors = window.db.getDoctors();

    // Extract unique values
    const insuranceOptions = [...new Set(doctors.flatMap(d => d.insurance))];
    const locationOptions = [...new Set(doctors.map(d => d.location))];

    const html = `
        <!-- Accordion: Convênio -->
        <details class="flex flex-col rounded-lg border border-border-dark bg-surface-dark px-4 py-3 group" open>
            <summary class="flex cursor-pointer items-center justify-between outline-none">
                <p class="text-sm font-medium leading-normal text-white">Convênio</p>
                <span class="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div class="pt-4 flex flex-col gap-3">
                ${insuranceOptions.map(opt => `
                    <label class="flex gap-x-3 items-center cursor-pointer">
                        <input type="checkbox" value="${opt}" class="filter-checkbox h-4 w-4 rounded border-border-dark bg-background-dark text-primary focus:ring-offset-background-dark focus:ring-primary" onchange="applyFilters()">
                        <span class="text-sm text-text-secondary group-hover:text-white transition-colors">${opt}</span>
                    </label>
                `).join('')}
            </div>
        </details>

        <!-- Accordion: Localização -->
        <details class="flex flex-col rounded-lg border border-border-dark bg-surface-dark px-4 py-3 group" open>
            <summary class="flex cursor-pointer items-center justify-between outline-none">
                <p class="text-sm font-medium leading-normal text-white">Localização</p>
                <span class="material-symbols-outlined text-text-secondary group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div class="pt-4 flex flex-col gap-3">
                <label class="flex gap-x-3 items-center cursor-pointer">
                    <input type="radio" name="location" value="all" checked class="h-4 w-4 border-border-dark bg-background-dark text-primary focus:ring-offset-background-dark focus:ring-primary" onchange="applyFilters()">
                    <span class="text-sm text-text-secondary">Todas as Unidades</span>
                </label>
                ${locationOptions.map(opt => `
                    <label class="flex gap-x-3 items-center cursor-pointer">
                        <input type="radio" name="location" value="${opt}" class="h-4 w-4 border-border-dark bg-background-dark text-primary focus:ring-offset-background-dark focus:ring-primary" onchange="applyFilters()">
                        <span class="text-sm text-text-secondary">Unidade ${opt}</span>
                    </label>
                `).join('')}
            </div>
        </details>
    `;

    container.innerHTML = html;
}

/**
 * Renders the grid of doctor cards.
 * @param {Array} doctorsList - List of doctor objects to render
 */
function renderDoctors(doctorsList) {
    const grid = document.getElementById('doctors-grid');

    if (doctorsList.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <span class="material-symbols-outlined text-4xl text-text-secondary mb-2">search_off</span>
                <h3 class="text-lg font-bold text-white">Nenhum médico encontrado</h3>
                <p class="text-text-secondary">Tente ajustar seus filtros de busca.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = doctorsList.map(doctor => `
        <div class="group flex flex-col bg-surface-dark border border-border-dark rounded-xl overflow-hidden hover:border-primary/50 transition-all shadow-sm hover:shadow-md hover:shadow-primary/5">
            <div class="p-5 flex gap-4 items-start">
                <div class="size-20 rounded-full bg-cover bg-center shrink-0 border-2 border-border-dark" 
                     style='background-image: url("${doctor.image}");'></div>
                <div class="flex flex-col flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-white text-lg font-bold leading-tight truncate">${doctor.name}</h3>
                            <p class="text-primary text-sm font-medium mt-1">${doctor.specialty}</p>
                        </div>
                        <div class="flex items-center gap-1 bg-background-dark px-2 py-1 rounded-md">
                            <span class="material-symbols-outlined text-yellow-400 text-[16px]">star</span>
                            <span class="text-white text-xs font-bold">${doctor.rating}</span>
                        </div>
                    </div>
                    <p class="text-text-secondary text-xs mt-1">${doctor.crm}</p>
                    <div class="flex items-center gap-2 mt-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">Aceita seu plano</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-border-dark text-text-secondary">${doctor.location}</span>
                    </div>
                </div>
            </div>
            
            <div class="h-px bg-border-dark mx-5"></div>
            
            <div class="p-5 flex flex-col gap-3">
                <div class="flex justify-between items-center">
                    <p class="text-sm font-medium text-white">Horários hoje</p>
                    <button class="text-xs text-primary hover:text-white transition-colors">Ver calendário</button>
                </div>
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    ${renderSlots(doctor.slots, doctor.id)}
                </div>
            </div>
            
            <div class="px-5 pb-5 pt-0">
                <button class="w-full py-2 rounded-lg border border-border-dark text-sm font-medium text-text-secondary hover:text-white hover:bg-border-dark transition-colors">
                    Ver Perfil Completo
                </button>
            </div>
        </div>
    `).join('');
}

function renderSlots(slots, doctorId) {
    if (!slots || slots.length === 0) {
        return `<span class="text-xs text-text-secondary italic py-2">Sem horários hoje - Próximo: Amanhã 08:00</span>`;
    }
    return slots.map(time => `
        <button onclick="selectSlot('${time}', ${doctorId})" class="shrink-0 px-4 py-2 bg-background-dark border border-border-dark hover:border-primary hover:bg-primary hover:text-white text-white rounded-lg text-sm font-medium transition-all">
            ${time}
        </button>
    `).join('');
}


/**
 * Filter logic
 */
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    // Get checkbox values
    const checkedInsurance = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(cb => cb.value);

    // Get radio value
    const selectedLocation = document.querySelector('input[name="location"]:checked').value;

    const allDoctors = window.db.getDoctors();

    const filtered = allDoctors.filter(doc => {
        // Search text
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm) ||
            doc.specialty.toLowerCase().includes(searchTerm);

        // Insurance (if any checked, must match at least one)
        const matchesInsurance = checkedInsurance.length === 0 ||
            doc.insurance.some(ins => checkedInsurance.includes(ins));

        // Location
        const matchesLocation = selectedLocation === 'all' || doc.location === selectedLocation;

        return matchesSearch && matchesInsurance && matchesLocation;
    });

    renderDoctors(filtered);
}

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', applyFilters);
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    document.querySelector('input[name="location"][value="all"]').checked = true;
    applyFilters();
}

function selectSlot(time, doctorId) {
    const doctor = window.db.getDoctors().find(d => d.id == doctorId);
    if (!doctor) return;

    createCheckoutModal(doctor, time);
}

function createCheckoutModal(doctor, time) {
    // Remove existing modal if any
    const existing = document.getElementById('checkout-modal');
    if (existing) existing.remove();

    const today = new Date().toLocaleDateString('pt-BR');

    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-surface-dark border border-border-dark rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-4 border-b border-border-dark flex justify-between items-center bg-background-dark">
                <h3 class="text-white font-bold">Resumo do Agendamento</h3>
                <button onclick="document.getElementById('checkout-modal').remove()" class="text-text-secondary hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="p-6 flex flex-col gap-6">
                <!-- Doctor Info -->
                <div class="flex gap-4 items-center">
                    <div class="size-16 rounded-full bg-cover bg-center border border-border-dark" style='background-image: url("${doctor.image}");'></div>
                    <div>
                        <h4 class="text-white font-bold text-lg">${doctor.name}</h4>
                        <p class="text-primary text-sm">${doctor.specialty}</p>
                    </div>
                </div>

                <!-- Appointment Details -->
                <div class="bg-background-dark rounded-lg p-4 border border-border-dark space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-text-secondary">Data</span>
                        <span class="text-white font-medium">Hoje, ${today}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-text-secondary">Horário</span>
                        <span class="text-white font-medium">${time}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-text-secondary">Local</span>
                        <span class="text-white font-medium">Unidade ${doctor.location}</span>
                    </div>
                    <div class="h-px bg-border-dark my-2"></div>
                    <div class="flex justify-between text-base">
                        <span class="text-white font-bold">Valor Total</span>
                        <span class="text-primary font-bold">R$ ${doctor.price.toFixed(2)}</span>
                    </div>
                </div>

                <!-- Payment Method (Mock) -->
                <div>
                    <label class="block text-xs font-bold text-text-secondary uppercase mb-2">Forma de Pagamento</label>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary">
                            <span class="material-symbols-outlined">credit_card</span>
                            Crédito
                        </button>
                        <button class="flex items-center justify-center gap-2 p-3 rounded-lg border border-border-dark bg-background-dark text-text-secondary hover:text-white hover:border-text-secondary transition-colors">
                            <span class="material-symbols-outlined">pix</span>
                            PIX
                        </button>
                    </div>
                </div>

                <!-- Installments -->
                <div>
                     <label class="block text-xs font-bold text-text-secondary uppercase mb-2">Parcelamento</label>
                     <select class="w-full bg-background-dark border border-border-dark text-white rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary">
                        <option value="1">1x de R$ ${doctor.price.toFixed(2)} sem juros</option>
                        <option value="2">2x de R$ ${(doctor.price / 2).toFixed(2)} sem juros</option>
                     </select>
                </div>

                <button onclick="processPayment('${doctor.id}', '${time}')" id="pay-btn" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">lock</span>
                    Pagar e Confirmar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function processPayment(doctorId, time) {
    const btn = document.getElementById('pay-btn');
    const originalText = btn.innerHTML;

    // Loading State
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Processando...`;

    // Mock Delay (CloudWalk integration simulation)
    setTimeout(() => {
        const doctor = window.db.getDoctors().find(d => d.id == doctorId);

        // Save to DB
        window.db.createAppointment({
            professional_id: doctorId,
            professional_name: doctor.name,
            specialty: doctor.specialty,
            date: new Date().toLocaleDateString('pt-BR'),
            time: time,
            location: doctor.location,
            price: doctor.price
        });

        // Success Feedback
        btn.classList.replace('bg-green-500', 'bg-blue-500');
        btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Sucesso!`;

        setTimeout(() => {
            window.location.href = 'my-appointments.html';
        }, 1000);

    }, 2000);
}
