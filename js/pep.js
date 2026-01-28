/**
 * PEP.JS
 * Prontuário Eletrônico do Paciente Logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Default load first patient
    loadPatient("1");

    document.getElementById('patient-search').addEventListener('change', (e) => {
        loadPatient(e.target.value);
    });
});

function loadPatient(query) {
    const patient = window.db.getPatient(query) || window.db.getPatients()[0]; // Fallback to first

    if (!patient) return;

    renderPatientHeader(patient);
    renderTimeline(patient.timeline);
}

function renderPatientHeader(patient) {
    const container = document.getElementById('pep-content');

    container.innerHTML = `
        <div class="max-w-[1200px] mx-auto flex flex-col gap-6">
            <!-- Patient Header Card -->
            <div class="bg-[#1a1f26] rounded-xl p-6 border border-[#293038] shadow-sm relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div class="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div class="flex gap-5 items-center">
                        <div class="bg-center bg-no-repeat bg-cover rounded-full size-24 border-2 border-[#293038] shadow-md" 
                             style='background-image: url("${patient.image}");'></div>
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h2 class="text-2xl font-bold text-white tracking-tight">${patient.name}</h2>
                                <span class="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase tracking-wide">Ativo</span>
                            </div>
                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-text-secondary text-sm">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">id_card</span> ID: #${patient.id}</span>
                                <span class="hidden sm:inline">•</span>
                                <span>${patient.age} Anos</span>
                                <span class="hidden sm:inline">•</span>
                                <span>${patient.gender}</span>
                                <span class="hidden sm:inline">•</span>
                                <span>${patient.insurance}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-3 w-full md:w-auto">
                        <button class="flex-1 md:flex-none h-10 px-4 rounded-lg bg-[#293038] hover:bg-[#3c4753] text-white border border-[#3c4753] text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <span class="material-symbols-outlined text-[18px]">edit_document</span> Editar
                        </button>
                    </div>
                </div>

                <!-- Critical Info Chips -->
                <div class="mt-6 pt-5 border-t border-[#293038] flex flex-wrap gap-3">
                     ${patient.allergies.map(alg => `
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-900/20 border border-red-900/30">
                            <span class="material-symbols-outlined text-red-400 text-[18px]">coronavirus</span>
                            <span class="text-red-200 text-xs font-bold tracking-wide uppercase">Alergia: ${alg}</span>
                        </div>
                     `).join('')}
                     
                     ${patient.conditions.map(cond => `
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-900/20 border border-yellow-900/30">
                            <span class="material-symbols-outlined text-yellow-500 text-[18px]">monitor_heart</span>
                            <span class="text-yellow-200 text-xs font-bold tracking-wide uppercase">${cond}</span>
                        </div>
                     `).join('')}

                     <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#293038] border border-[#3c4753]">
                        <span class="material-symbols-outlined text-text-secondary text-[18px]">height</span>
                        <span class="text-gray-300 text-xs font-bold tracking-wide uppercase">${patient.vitals.height}</span>
                    </div>
                     <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#293038] border border-[#3c4753]">
                        <span class="material-symbols-outlined text-text-secondary text-[18px]">monitor_weight</span>
                        <span class="text-gray-300 text-xs font-bold tracking-wide uppercase">${patient.vitals.weight}</span>
                    </div>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="border-b border-[#293038] sticky top-0 bg-[#111418] z-20 pt-2">
                <nav aria-label="Tabs" class="flex space-x-8">
                    <a class="border-b-2 border-primary py-4 px-1 text-sm font-bold text-white flex items-center gap-2" href="#">
                        <span class="material-symbols-outlined text-[20px]">history</span>
                        Histórico
                    </a>
                </nav>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6" id="pep-timeline-area">
                <!-- Timeline will be rendered here -->
            </div>
             <div class="h-10"></div>
        </div>
    `;
}

function renderTimeline(timeline) {
    const area = document.getElementById('pep-timeline-area');

    // Left Column (Timeline)
    const timelineHtml = `
        <div class="xl:col-span-2 flex flex-col gap-6">
            <h3 class="text-lg font-bold text-white">Timeline Clínica</h3>
            
            ${timeline.map(event => `
                <div class="flex gap-4 group">
                    <div class="flex flex-col items-center">
                        <div class="size-3 bg-${event.colorClass}-500 rounded-full ring-4 ring-${event.colorClass}-500/20"></div>
                        <div class="w-0.5 bg-[#293038] h-full my-2 group-last:hidden"></div>
                    </div>
                    <div class="flex-1 bg-[#1a1f26] border border-[#293038] rounded-xl p-5 hover:border-[#3c4753] transition-colors relative">
                        <div class="absolute top-5 right-5 text-xs text-text-secondary font-medium">${event.date}, ${event.time}</div>
                        <div class="flex items-start gap-4">
                            <div class="p-2 bg-${event.colorClass}-500/10 rounded-lg text-${event.colorClass}-400 shrink-0">
                                <span class="material-symbols-outlined">${event.icon}</span>
                            </div>
                            <div>
                                <h4 class="text-white font-bold text-base">${event.title}</h4>
                                <p class="text-text-secondary text-sm mt-1">${event.professional}</p>
                                <p class="text-gray-300 text-sm mt-3 leading-relaxed">
                                    ${event.description}
                                </p>
                                ${event.tags ? `
                                    <div class="flex gap-2 mt-4">
                                        ${event.tags.map(tag => `
                                            <span class="px-2 py-1 bg-[#293038] rounded text-xs text-text-secondary font-medium border border-[#3c4753]">${tag}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                ${event.hasAttachment ? `
                                    <div class="mt-4">
                                         <button class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#293038] border border-[#3c4753] hover:bg-[#3c4753] transition-colors text-xs font-bold text-white">
                                            <span class="material-symbols-outlined text-red-400 text-sm">picture_as_pdf</span>
                                            ${event.attachmentUrl}
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <!-- Right Column (Tools) -->
        <div class="flex flex-col gap-6">
             <div class="bg-[#1a1f26] border border-[#293038] rounded-xl overflow-hidden flex flex-col h-fit">
                <div class="p-4 border-b border-[#293038] bg-[#1f252e]">
                    <h3 class="text-sm font-bold text-white uppercase tracking-wide">Ações Rápidas</h3>
                </div>
                <div class="p-4 flex flex-col gap-3">
                    <button class="w-full py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-bold transition-colors">
                        Nova Prescrição
                    </button>
                     <button class="w-full py-2.5 rounded-lg border border-[#3c4753] text-white hover:bg-[#3c4753] text-sm font-bold transition-colors">
                        Solicitar Exame
                    </button>
                </div>
            </div>
        </div>
    `;

    area.innerHTML = timelineHtml;
}
