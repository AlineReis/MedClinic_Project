import DB from '../services/db';
import type { User, Appointment } from '../types';

const PatientHistory = {
    render(patientId: number) {
        const patient = DB.users.findById(patientId);
        if (!patient) {
            console.error('Paciente não encontrado');
            return;
        }

        const container = document.getElementById('patientsPage');
        if (!container) return;

        // Ocultar grid de lista e mostrar detalhes
        const grid = container.querySelector('.patients-grid') as HTMLElement;
        const searchBar = container.querySelector('.search-bar') as HTMLElement;

        if (grid) grid.style.display = 'none';
        if (searchBar) searchBar.style.display = 'none';

        // Verificar se já existe container de detalhes, senão criar
        let detailsContainer = document.getElementById('patientDetails');
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.id = 'patientDetails';
            detailsContainer.className = 'patient-details-view fade-in';
            detailsContainer.style.display = 'block'; // Ensure it's visible
            container.appendChild(detailsContainer);
        } else {
            detailsContainer.style.display = 'block';
        }

        // Buscar dados relacionados
        const appointments = DB.appointments.findAll()
            .filter((a: Appointment) => a.patientId == patientId) // Loose equality for consistency with existing mocks
            .sort((a: any, b: any) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

        detailsContainer.innerHTML = this.getTemplate(patient, appointments);

        // Setup tabs logic
        this.setupTabs();
    },

    back() {
        const container = document.getElementById('patientsPage');
        if (!container) return;

        const grid = container.querySelector('.patients-grid') as HTMLElement;
        const searchBar = container.querySelector('.search-bar') as HTMLElement;
        const detailsContainer = document.getElementById('patientDetails');

        if (grid) grid.style.display = 'grid';
        if (searchBar) searchBar.style.display = 'flex';
        if (detailsContainer) detailsContainer.style.display = 'none';
    },

    getTemplate(patient: User, appointments: Appointment[]) {
        const initials = patient.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        const age = this.calculateAge(patient.patient_details?.birth_date);

        return `
            <div class="details-header">
                <button class="btn-back" onclick="App.closePatientHistory()">
                    <span class="material-icons-round">arrow_back</span> Voltar
                </button>
                <div class="actions">
                    <button class="btn-primary" onclick="App.openNewAppointmentModal('${patient.id}')">
                        <span class="material-icons-round">calendar_today</span> Novo Agendamento
                    </button>
                    <button class="btn-secondary" onclick="App.Toast.info('Funcionalidade em desenvolvimento')">
                        <span class="material-icons-round">edit</span> Editar
                    </button>
                </div>
            </div>

            <div class="patient-profile-header">
                <div class="profile-main">
                    <div class="avatar-large">${initials}</div>
                    <div class="info">
                        <h2>${patient.name}</h2>
                        <div class="meta">
                            <span><i class="material-icons-round">badge</i> ${patient.cpf || 'CPF n/a'}</span>
                            <span><i class="material-icons-round">cake</i> ${age} anos</span>
                            <span><i class="material-icons-round">health_and_safety</i> ${patient.patient_details?.insurance_plan || 'Particular'}</span>
                        </div>
                    </div>
                </div>
                <div class="quick-stats">
                    <div class="stat">
                        <span class="val">${appointments.length}</span>
                        <span class="lbl">Consultas</span>
                    </div>
                    <div class="stat">
                        <span class="val">0</span>
                        <span class="lbl">Faltas</span>
                    </div>
                    <div class="stat">
                        <span class="val">100%</span>
                        <span class="lbl">Assiduidade</span>
                    </div>
                </div>
            </div>

            <div class="patient-tabs">
                <button class="tab-btn active" data-tab="history">Histórico Clínico</button>
                <button class="tab-btn" data-tab="appointments">Consultas (${appointments.length})</button>
                <button class="tab-btn" data-tab="exams">Exames</button>
                <button class="tab-btn" data-tab="files">Arquivos</button>
            </div>

            <div class="tab-content active" id="history">
                <div class="timeline">
                    ${this.renderTimeline(appointments)}
                </div>
            </div>

            <div class="tab-content" id="appointments">
                ${this.renderAppointmentsTable(appointments)}
            </div>

            <div class="tab-content" id="exams">
                <div class="empty-state">
                    <p>Nenhum exame registrado.</p>
                </div>
            </div>
             <div class="tab-content" id="files">
                <div class="empty-state">
                    <p>Nenhum arquivo anexado.</p>
                </div>
            </div>
        `;
    },

    renderTimeline(appointments: Appointment[]) {
        if (appointments.length === 0) {
            return '<div class="empty-state"><p>Nenhum registro histórico.</p></div>';
        }

        return appointments.map(apt => `
            <div class="timeline-item">
                <div class="date-badge">
                    <span class="day">${new Date(apt.date).getDate()}</span>
                    <span class="month">${new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                </div>
                <div class="content">
                    <div class="header">
                        <h4>${apt.type === 'consulta' ? 'Consulta Médica' : 'Retorno'}</h4>
                        <span class="tag ${apt.status}">${this.translateStatus(apt.status)}</span>
                    </div>
                    <p class="doctor">Dr(a). ${this.getDoctorName(apt.doctorId)} - ${apt.specialty || 'Clínica Geral'}</p>
                    <p class="notes">${apt.notes || 'Sem anotações clínicas.'}</p>
                </div>
            </div>
        `).join('');
    },

    renderAppointmentsTable(appointments: Appointment[]) {
        if (appointments.length === 0) return '<div class="empty-state"><p>Nenhuma consulta encontrada.</p></div>';

        return `
            <table class="simple-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Médico</th>
                        <th>Tipo</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${appointments.map(apt => `
                        <tr>
                            <td>${new Date(apt.date).toLocaleDateString('pt-BR')}</td>
                            <td>${apt.time}</td>
                            <td>${this.getDoctorName(apt.doctorId)}</td>
                            <td>${apt.type}</td>
                            <td><span class="status-badge ${apt.status}">${this.translateStatus(apt.status)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    calculateAge(birthDate?: string) {
        if (!birthDate) return '--';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },

    getDoctorName(id: number) {
        const doc = DB.users.findById(id);
        return doc ? doc.name : 'Desconhecido';
    },

    translateStatus(status: string) {
        const map: Record<string, string> = {
            'scheduled': 'Agendado',
            'confirmed': 'Confirmado',
            'completed': 'Concluído',
            'cancelled': 'Cancelado'
        };
        return map[status] || status;
    },

    setupTabs() {
        const tabs = document.querySelectorAll('#patientDetails .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class
                document.querySelectorAll('#patientDetails .tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('#patientDetails .tab-content').forEach(c => c.classList.remove('active'));

                // Add active
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-tab');
                if (targetId) {
                    const content = document.getElementById(targetId);
                    if (content) content.classList.add('active');
                }
            });
        });
    }
};

export default PatientHistory;
