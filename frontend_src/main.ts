import Auth from './services/auth';
import DB from './services/db';
import Utils from './utils/validators';
import Modal from './components/Modal';
import Toast from './components/Toast';
import Form from './components/Form';
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
    Modal,
    Toast,
    Form,

    init() {
        console.log('🏥 MedClinic - Inicializando aplicação...');

        // Init Components
        Modal.init();
        Toast.init();

        // LIMPAR localStorage para sempre começar no login (modo dev)
        localStorage.removeItem('medclinic_user');
        console.log('🔄 localStorage limpo - sempre inicia no login');

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
        console.log('📌 Configurando event listeners...');

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('✅ Login form encontrado');
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        } else {
            console.log('❌ Login form NÃO encontrado');
        }

        // Password toggle
        const passwordToggle = document.querySelector('.password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePassword());
        }

        // Show/Hide test users dropdown
        const showTestUsers = document.getElementById('showTestUsers');
        const testUsersDropdown = document.getElementById('testUsersDropdown');

        if (showTestUsers && testUsersDropdown) {
            console.log('✅ Botão de usuários de teste encontrado');
            showTestUsers.addEventListener('click', () => {
                console.log('🖱️ Clicou em Ver usuários de teste');
                const isVisible = testUsersDropdown.style.display === 'block';
                testUsersDropdown.style.display = isVisible ? 'none' : 'block';
                console.log('👁️ Dropdown agora está:', testUsersDropdown.style.display);
            });
        } else {
            console.log('❌ Botão ou dropdown de usuários NÃO encontrado');
        }

        // Test user items - auto-fill and close dropdown
        const testUserItems = document.querySelectorAll('.test-user-item');
        console.log(`📋 Encontrados ${testUserItems.length} usuários de teste`);

        testUserItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🖱️ Clicou no usuário ${index + 1}`);

                const target = e.currentTarget as HTMLElement;
                const email = target.getAttribute('data-email');
                const password = target.getAttribute('data-password');

                console.log('📧 Email:', email);
                console.log('🔑 Senha:', password);

                const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
                const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;

                if (emailInput && email) {
                    emailInput.value = email;
                    console.log('✅ Email preenchido');
                }

                if (passwordInput && password) {
                    passwordInput.value = password;
                    console.log('✅ Senha preenchida');
                }

                // Close dropdown after selection
                if (testUsersDropdown) {
                    testUsersDropdown.style.display = 'none';
                    console.log('✅ Dropdown fechado');
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
        console.log('🔐 Tentando fazer login...');

        const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
        const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
        const errorDiv = document.getElementById('loginError');

        if (!emailInput || !passwordInput || !errorDiv) return;

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const result = await Auth.login(email, password);
            console.log('✅ Login bem-sucedido!');
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            AppState.currentUser = result.user; // Update local state
            this.showAppContainer();
            this.updateUserUI();
            this.navigate('home');
        } catch (error: any) {
            console.log('❌ Login falhou:', error.message);
            errorDiv.textContent = error.message || 'Erro desconhecido';
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
        switch (page) {
            case 'home':
                this.loadDashboard();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'patients':
                this.loadPatients();
                break;
            case 'doctors':
                this.loadDoctors();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    },

    loadDashboard() {
        // Load upcoming appointments
        const container = document.getElementById('upcomingAppointments');
        if (!container) return;

        const userAppointments = this.getUpcomingAppointments();

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
            if (user.role === 'health_professional') {
                return apt.doctorId === user.id && apt.date >= today;
            } else if (user.role === 'patient') {
                return apt.patientId === user.id && apt.date >= today;
            }
            return apt.date >= today; // Admin/Recepcionista vê tudo
        }).slice(0, 5);
    },

    loadAppointments() {
        console.log('Loading appointments page...');
        // TODO: Implementar listagem completa de consultas
    },

    loadPatients() {
        console.log('Loading patients page...');
        // TODO: Implementar listagem de pacientes
    },

    loadDoctors() {
        console.log('Loading doctors page...');
        // TODO: Implementar listagem de médicos
    },

    loadProfile() {
        console.log('Loading profile page...');
        // TODO: Implementar página de perfil
    },

    handleQuickAction(action: string) {
        console.log('Quick action:', action);

        switch (action) {
            case 'new-appointment':
                this.showToast('info', 'Novo Agendamento', 'Funcionalidade em desenvolvimento');
                break;
            case 'new-patient':
                this.showToast('info', 'Cadastro de Paciente', 'Funcionalidade em desenvolvimento');
                break;
            case 'search-records':
                this.showToast('info', 'Buscar Prontuário', 'Funcionalidade em desenvolvimento');
                break;
            case 'reports':
                this.showToast('info', 'Relatórios', 'Funcionalidade em desenvolvimento');
                break;
        }
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
