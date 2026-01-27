import Auth from './services/auth';
import DB from './services/db';
import Schedule from './services/schedule';
import Utils from './utils/validators';
import Modal from './components/Modal';
import Toast from './components/Toast';
import Form from './components/Form';
import AppointmentModal from './components/AppointmentModal';
import PatientModal from './components/PatientModal';
import PatientHistory from './components/PatientHistory';
import DoctorManager from './components/DoctorManager';
import type { User, Appointment } from './types';

/**
 * MedClinic - Sistema de Gerenciamento de Clínicas Médicas
 * Frontend TypeScript - Versão 1.0
 */

// ========================================
// DATA STORE & STATE MANAGEMENT
// ========================================

interface AppStateInterface {
    currentUser: User | null;
    currentPage: string;
    appointments: Appointment[];
    patients: User[];
    doctors: User[];
    users: User[];
    medicalRecords: unknown[];
    exams: unknown[];
}

const AppState: AppStateInterface = {
    currentUser: null,
    currentPage: 'home',
    appointments: [],
    patients: [],
    doctors: [],
    users: [],
    medicalRecords: [],
    exams: []
};

// ========================================
// MAIN APP CONTROLLER
// ========================================

const App = {
    /* =========================================================================
       PATIENTS PAGE
       ========================================================================= */
    loadPatients(filter = '') {
        const container = document.querySelector('.patients-grid');
        if (!container) return;

        // Ensure we are on patients page or container exists
        const patients = DB.users.findAll().filter((u: User) => u.role === 'paciente');

        let filteredPatients = patients;
        if (filter) {
            const term = filter.toLowerCase();
            filteredPatients = patients.filter((p: User) =>
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.email && p.email.toLowerCase().includes(term)) ||
                (p.cpf && p.cpf.includes(term)) ||
                (p.patient_details?.insurance_plan && p.patient_details.insurance_plan.toLowerCase().includes(term))
            );
        }

        if (filteredPatients.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                    <p style="color: var(--color-gray-500);">Nenhum paciente encontrado.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredPatients.map((patient: User) => {
            const initials = patient.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

            // Mock data for display if details missing
            const plan = patient.patient_details?.insurance_plan || 'Particular';
            const lastVisit = '15/01/2026'; // Mocked for now, implies DB relation
            const totalVisits = '3'; // Mocked

            return `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar">${initials}</div>
                    <div class="patient-info">
                        <h3 class="patient-name">${patient.name}</h3>
                        <p class="patient-cpf">${patient.cpf || 'CPF não informado'}</p>
                    </div>
                </div>
                <div class="patient-details">
                    <div class="detail-item">
                        <span class="detail-label">Convênio</span>
                        <span class="detail-value">${plan}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Última consulta</span>
                        <span class="detail-value">${lastVisit}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Consultas</span>
                        <span class="detail-value">${totalVisits} realizadas</span>
                    </div>
                </div>
                <div class="patient-actions">
                    <button class="btn-secondary-small" onclick="App.openPatientHistory('${patient.id}')">Ver Prontuário</button>
                    <button class="btn-secondary-small" onclick="App.openNewAppointmentModal('${patient.id}')">Agendar</button>
                </div>
            </div>
            `;
        }).join('');
    },

    setupPatientSearch() {
        const searchInput = document.querySelector('#patientsPage .search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e: any) => {
                this.loadPatients(e.target.value);
            });
        }
    },

    /* =========================================================================
       DOCTORS PAGE (Placeholder for Phase 3)
       ========================================================================= */
    Modal,
    Toast,
    Form,

    init() {
        // Initialize DBComponents
        Modal.init();
        Toast.init();

        // Initialize DB
        DB.init();

        // Clear previous session/state for debugging/demo purposes
        // localStorage.removeItem('medclinic_session');

        // Setup event listeners PRIMEIRO (antes de mostrar qualquer coisa)
        this.setupEventListeners();

        // Sempre mostrar login primeiro
        this.showLoginPage();

        // Hide loading screen after delay
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 1500);
    },

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => this.handleLogin(e));
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        const loginPassword = document.getElementById('loginPassword') as HTMLInputElement;

        if (togglePassword && loginPassword) {
            togglePassword.addEventListener('click', () => {
                const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
                loginPassword.setAttribute('type', type);

                // Update icon
                togglePassword.innerHTML = type === 'password'
                    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
                    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
            });
        }

        // --- DEV ONLY: Test Users ---
        // Fill login form with test user data
        const showTestUsers = document.getElementById('showTestUsers');
        const testUserItems = document.querySelectorAll('.test-user-item');
        const testUsersDropdown = document.getElementById('testUsersDropdown');

        if (showTestUsers && testUsersDropdown) {
            showTestUsers.addEventListener('click', () => {
                const isVisible = testUsersDropdown.style.display === 'block';
                testUsersDropdown.style.display = isVisible ? 'none' : 'block';
            });
        }

        // Test user items - auto-fill and close dropdown
        testUserItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                const target = e.currentTarget as HTMLElement;
                const email = target.getAttribute('data-email');
                const password = target.getAttribute('data-password');

                const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
                const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;

                if (emailInput && email) {
                    emailInput.value = email;
                }

                if (passwordInput && password) {
                    passwordInput.value = password;
                }

                // Close dropdown after selection
                if (testUsersDropdown) {
                    testUsersDropdown.style.display = 'none';
                }

                // Visual feedback
                if (target) {
                    target.style.background = 'var(--color-primary-light)';
                    setTimeout(() => {
                        target.style.background = '';
                    }, 300);
                }
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.currentTarget as HTMLElement;
                const page = target.getAttribute('data-page');
                if (page) this.navigate(page);
            });
        });

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) dropdown.classList.toggle('active');
            });
        }

        // Logout button
        document.querySelectorAll('.logout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const action = target.getAttribute('data-action');
                if (action) this.handleQuickAction(action);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const overlay = btn.closest('.modal-overlay');
                if (overlay) overlay.classList.remove('active');
            });
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    },

    async handleLogin(e: Event) {
        e.preventDefault();

        const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
        const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
        const errorDiv = document.getElementById('loginError');

        if (!emailInput || !passwordInput || !errorDiv) return;

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const result = await Auth.login(email, password);
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            AppState.currentUser = result.user; // Update local state
            this.showAppContainer();
            this.updateUserUI();
            this.navigate('home');
        } catch (error: any) {
            this.showToast('error', 'Erro ao fazer login', error.message || 'Erro desconhecido');
            errorDiv.style.display = 'block';
        }
    },

    togglePassword() {
        const input = document.getElementById('loginPassword') as HTMLInputElement;
        const toggleBtn = document.querySelector('.password-toggle');
        if (!input || !toggleBtn) return;

        const icon = toggleBtn.querySelector('.eye-icon') as HTMLElement;

        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.style.opacity = '0.5';
        } else {
            input.type = 'password';
            if (icon) icon.style.opacity = '1';
        }
    },

    showLoginPage() {
        const loginContainer = document.getElementById('loginContainer');
        const appContainer = document.getElementById('appContainer');

        if (loginContainer) {
            loginContainer.style.display = 'flex';
            loginContainer.classList.add('active');
        }

        if (appContainer) {
            appContainer.style.display = 'none';
            appContainer.classList.remove('active');
        }

        document.body.classList.remove('logged-in');
    },

    showAppContainer() {
        const loginContainer = document.getElementById('loginContainer');
        const appContainer = document.getElementById('appContainer');

        if (loginContainer) {
            loginContainer.style.display = 'none';
            loginContainer.classList.remove('active');
        }

        if (appContainer) {
            appContainer.style.display = 'block';
            setTimeout(() => {
                appContainer.classList.add('active');
            }, 10);
        }

        document.body.classList.add('logged-in');
    },

    updateUserUI() {
        const user = AppState.currentUser;
        if (!user) return;

        // Update user info in sidebar
        const userName = document.querySelector('.user-name');
        const userRole = document.querySelector('.user-role');
        const userAvatar = document.querySelector('.user-avatar');

        if (userName) userName.textContent = user.name;
        if (userRole) userRole.textContent = this.getRoleLabel(user.role);
        if (userAvatar) userAvatar.textContent = user.avatar || 'U';

        // Update hero
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const greeting = this.getGreeting();
            heroTitle.textContent = `${greeting}, ${user.name.split(' ')[0]} 👋`;
        }

        // Apply role-based visibility
        this.applyRoleVisibility();
    },

    getRoleLabel(role: string) {
        const labels: Record<string, string> = {
            'admin': 'Administrador',
            'medico': 'Médico',
            'recepcionista': 'Recepcionista',
            'clinic_admin': 'Gestor',
            'paciente': 'Paciente',
            'system_admin': 'Admin do Sistema',
            'health_professional': 'Profissional de Saúde',
            'lab_tech': 'Técnico de Laboratório'
        };
        return labels[role] || role;
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    },

    applyRoleVisibility() {
        const userRole = AppState.currentUser?.role;
        if (!userRole) return;

        document.querySelectorAll('[data-require-role]').forEach(element => {
            const requiredRoles = element.getAttribute('data-require-role')?.split(',');
            if (requiredRoles && requiredRoles.map(r => r.trim()).includes(userRole)) {
                (element as HTMLElement).style.display = '';
            } else {
                (element as HTMLElement).style.display = 'none';
            }
        });
    },

    navigate(page: string) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Show page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            AppState.currentPage = page;

            // Load page data
            this.loadPageData(page);
        }
    },

    loadPageData(page: string) {
        // Setup specific page logic
        if (page === 'appointments') {
            this.loadAppointments();
            // Assuming setupAppointmentFilters() exists or will be added
            // this.setupAppointmentFilters();
        } else if (page === 'home') {
            this.loadDashboard();
        } else if (page === 'patients') {
            this.loadPatients();
            // Assuming setupPatientSearch() exists or will be added
            this.setupPatientSearch();
        } else if (page === 'doctors') {
            DoctorManager.renderList();
        } else if (page === 'profile') {
            this.loadProfile();
        }
    },

    loadDashboard() {
        // Load upcoming appointments
        const container = document.getElementById('upcomingAppointments');
        if (!container) return;

        const userAppointmentsRaw = this.getUpcomingAppointments();

        // Enrich data
        const userAppointments = userAppointmentsRaw.map((apt: any) => {
            // Aceita patientId (novo) ou patient_id (legado)
            const pId = apt.patientId || apt.patient_id;
            const dId = apt.doctorId || apt.professional_id;

            const patient = DB.users.findById(pId);
            const doctor = DB.users.findById(dId);

            return {
                ...apt,
                patientName: patient?.name || 'Desconhecido',
                doctorName: doctor?.name || 'Desconhecido',
                specialty: doctor?.professional_details?.specialty || 'Geral'
            };
        });

        if (userAppointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <p style="color: var(--color-gray-500);">Nenhuma consulta agendada</p>
                </div>
            `;
            return;
        }

        if (AppState.currentUser) {
            const isMedico = AppState.currentUser.role === 'medico';

            container.innerHTML = userAppointments.map((apt: any) => `
                <div class="appointment-item">
                    <div class="appointment-time">
                        <span class="time">${apt.time}</span>
                        <span class="date">${this.formatDate(apt.date)}</span>
                    </div>
                    <div class="appointment-details">
                        <h4>${isMedico ? apt.patientName : apt.doctorName}</h4>
                        <p>${apt.specialty} • ${apt.type === 'online' ? 'Online' : 'Presencial'}</p>
                    </div>
                    <span class="appointment-status ${apt.status}">${apt.status}</span>
                </div>
            `).join('');
        }
    },

    getUpcomingAppointments() {
        const user = AppState.currentUser;
        if (!user) return [];

        const today = new Date().toISOString().split('T')[0];

        return DB.appointments.findAll().filter((apt: any) => {
            if (user.role === 'medico') {
                return apt.doctorId === user.id && apt.date >= today;
            } else if (user.role === 'paciente') {
                return apt.patientId === user.id && apt.date >= today;
            }
            return apt.date >= today; // Admin/Recepcionista vê tudo
        }).slice(0, 5);
    },

    loadAppointments() {
        const container = document.getElementById('appointmentsList');
        if (!container) return;

        // Limpar loading
        container.innerHTML = '';

        // Obter filtros (futuro: ler dos inputs)
        const allAppointments = DB.appointments.findAll();

        // Simular join com users e cast para tipos corretos
        const enrichedAppointments = allAppointments.map((apt: any): Appointment & { patientName: string; doctorName: string; specialty: string } => {
            const patient = DB.users.findById(apt.patientId);
            const doctor = DB.users.findById(apt.doctorId);
            return {
                ...apt,
                patientName: patient?.name || 'Desconhecido',
                doctorName: doctor?.name || 'Desconhecido',
                specialty: doctor?.professional_details?.specialty || 'Geral'
            };
        });

        // Ordenar por data/hora descrescente
        enrichedAppointments.sort((a: any, b: any) => {
            return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
        });

        if (enrichedAppointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma consulta encontrada.</p>
                </div>
            `;
            return;
        }

        enrichedAppointments.forEach((apt: any) => {
            const row = document.createElement('div');
            row.className = 'table-row';

            const isMedico = AppState.currentUser?.role === 'medico';
            const primaryName = isMedico ? apt.patientName : apt.doctorName;
            const secondaryName = isMedico ? 'Paciente' : apt.specialty;

            row.innerHTML = `
                <div class="td">
                    <div class="user-info">
                        <div class="avatar-small">${primaryName.charAt(0)}</div>
                        <div>
                            <span class="name">${primaryName}</span>
                            <span class="sub-text">${secondaryName}</span>
                        </div>
                    </div>
                </div>
                <div class="td">
                    <span class="date">${this.formatDate(apt.date)}</span>
                    <span class="time">${apt.time}</span>
                </div>
                <div class="td">
                    <span class="type">${apt.type === 'online' ? 'Online' : 'Presencial'}</span>
                    <span class="sub-text">${apt.type}</span>
                </div>
                <div class="td">
                    <span class="status-badge ${apt.status}">${this.getStatusLabel(apt.status)}</span>
                </div>
                <div class="td actions">
                    ${apt.status === 'scheduled' ? `
                        <button class="icon-btn danger cancel-btn" title="Cancelar">
                            ✕
                        </button>
                    ` : ''}
                </div>
            `;

            // Event listeners para ações
            const cancelBtn = row.querySelector('.cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.handleCancelAppointment(apt.id));
            }

            container.appendChild(row);
        });
    },

    getStatusLabel(status: string) {
        const map: Record<string, string> = {
            'scheduled': 'Agendada',
            'confirmed': 'Confirmada',
            'completed': 'Concluída',
            'cancelled': 'Cancelada',
            'cancelled_by_patient': 'Canc. p/ Paciente',
            'cancelled_by_clinic': 'Canc. p/ Clínica'
        };
        return map[status] || status;
    },

    async handleCancelAppointment(id: number) {
        if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;

        try {
            await Schedule.cancelAppointment(id, 'cancelled_by_clinic', 'admin'); // Arguments fixed
            Toast.success('Consulta cancelada com sucesso');
            this.loadAppointments();
            this.loadDashboard();
        } catch (error: any) {
            Toast.error(error.message);
        }
    },



    loadDoctors() {
        DoctorManager.renderList();
    },

    loadProfile() {
        // TODO: Implementar página de perfil
    },

    handleQuickAction(action: string) {
        switch (action) {
            case 'new-appointment':
                AppointmentModal.open();
                break;
            case 'new-patient':
                PatientModal.open();
                break;
            case 'search-records':
                this.showToast('info', 'Buscar Prontuário', 'Funcionalidade em desenvolvimento');
                break;
            case 'reports':
                this.showToast('info', 'Relatórios', 'Funcionalidade em desenvolvimento');
                break;
        }
    },

    openNewPatientModal() {
        PatientModal.open();
    },

    openPatientHistory(patientId: string) {
        PatientHistory.render(parseInt(patientId));
    },

    closePatientHistory() {
        PatientHistory.back();
    },

    formatDate(dateString: string) {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
        return date.toLocaleDateString('pt-BR', options);
    },

    showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons: Record<string, string> = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">✕</button>
        `;

        container.appendChild(toast);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });
        }

        // Auto remove
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
};

// ========================================
// INITIALIZE APP
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for use in HTML inline scripts
(window as any).App = App;
(window as any).Auth = Auth;
