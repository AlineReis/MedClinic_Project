/**
 * NAVIGATION.JS
 * MedClinic - Navigation Helper (Non-Intrusive)
 * Updates menu content based on user role WITHOUT replacing existing structure
 */

const Navigation = {
    /**
     * Role display names in Portuguese
     */
    roleNames: {
        patient: 'Paciente',
        receptionist: 'Recepcionista',
        lab_tech: 'Técnico de Laboratório',
        health_professional: 'Profissional de Saúde',
        clinic_admin: 'Administrador',
        system_admin: 'Admin do Sistema'
    },

    /**
     * Dashboard URLs per role
     */
    dashboards: {
        patient: 'patient-dashboard.html',
        receptionist: 'reception-dashboard.html',
        lab_tech: 'lab-dashboard.html',
        health_professional: 'doctor-dashboard.html',
        clinic_admin: 'manager-dashboard.html',
        system_admin: 'admin-dashboard.html'
    },

    /**
     * Get current user role from localStorage
     */
    getRole() {
        return localStorage.getItem('userRole') || 'patient';
    },

    /**
     * Get user name from localStorage
     */
    getUserName() {
        return localStorage.getItem('userName') || 'Usuário';
    },

    /**
     * Get user initials
     */
    getInitials() {
        const name = this.getUserName();
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    },

    /**
     * Get dashboard URL for current role
     */
    getDashboard() {
        return this.dashboards[this.getRole()] || 'login.html';
    },

    /**
     * Navigate back with fallback to dashboard
     */
    goBack() {
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            window.location.href = this.getDashboard();
        }
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('medclinic_auth');
        window.location.href = 'login.html';
    },

    /**
     * Update user info in existing elements
     * Looks for elements with specific data attributes or classes
     */
    updateUserInfo() {
        const role = this.getRole();
        const userName = this.getUserName();
        const initials = this.getInitials();

        // Update user name elements
        document.querySelectorAll('[data-user-name], .user-name').forEach(el => {
            el.textContent = userName;
        });

        // Update user role elements
        document.querySelectorAll('[data-user-role], .user-role').forEach(el => {
            el.textContent = this.roleNames[role] || role;
        });

        // Update user initials in avatar elements
        document.querySelectorAll('[data-user-initials], .user-initials').forEach(el => {
            el.textContent = initials;
        });

        // Update dashboard links
        document.querySelectorAll('[data-dashboard-link]').forEach(el => {
            el.href = this.getDashboard();
        });

        // Update back buttons
        document.querySelectorAll('[data-back-button]').forEach(el => {
            el.onclick = () => this.goBack();
        });

        // Update logout buttons
        document.querySelectorAll('[data-logout-button], .logout-btn').forEach(el => {
            el.onclick = () => this.logout();
        });
    },

    /**
     * Add back button to page if it has a placeholder
     */
    addBackButton() {
        const container = document.querySelector('[data-back-container]');
        if (container && !container.querySelector('.back-btn')) {
            const btn = document.createElement('button');
            btn.className = 'back-btn p-2 -ml-2 text-slate-400 hover:text-white hover:bg-border-dark/50 rounded-lg transition-colors';
            btn.onclick = () => this.goBack();
            btn.innerHTML = '<span class="material-symbols-outlined">arrow_back</span>';
            btn.title = 'Voltar';
            container.insertBefore(btn, container.firstChild);
        }
    },

    /**
     * Check access permission for current page based on role
     * Returns true if user has access, false otherwise
     */
    checkAccess() {
        const role = this.getRole();
        const page = window.location.pathname.split('/').pop();

        // Define page access rules based on RN-03
        const accessRules = {
            // Patient pages
            'patient-dashboard.html': ['patient', 'receptionist', 'clinic_admin', 'system_admin'],
            'my-appointments.html': ['patient', 'receptionist', 'clinic_admin', 'system_admin'],
            'doctors.html': ['patient', 'receptionist', 'clinic_admin', 'system_admin'],
            'slots.html': ['patient', 'receptionist', 'clinic_admin', 'system_admin'],
            'checkout.html': ['patient', 'receptionist', 'clinic_admin', 'system_admin'],

            // Professional pages
            'doctor-dashboard.html': ['health_professional', 'clinic_admin', 'system_admin'],
            'prescription.html': ['health_professional', 'clinic_admin', 'system_admin'],
            'telemedicine.html': ['patient', 'health_professional', 'clinic_admin', 'system_admin'],

            // Staff pages
            'reception-dashboard.html': ['receptionist', 'clinic_admin', 'system_admin'],
            'lab-dashboard.html': ['lab_tech', 'clinic_admin', 'system_admin'],
            'agenda.html': ['receptionist', 'health_professional', 'clinic_admin', 'system_admin'],
            'pep.html': ['receptionist', 'health_professional', 'clinic_admin', 'system_admin'],
            'exams.html': ['patient', 'lab_tech', 'health_professional', 'clinic_admin', 'system_admin'],

            // Admin pages
            'manager-dashboard.html': ['clinic_admin', 'system_admin'],
            'financial.html': ['clinic_admin', 'system_admin'],
            'users.html': ['clinic_admin', 'system_admin'],
            'dashboard.html': ['clinic_admin', 'system_admin'],
            'admin-dashboard.html': ['system_admin'],
        };

        const allowedRoles = accessRules[page];

        // If no rules defined, allow access
        if (!allowedRoles) return true;

        // Check if current role is allowed
        if (!allowedRoles.includes(role)) {
            console.warn(`Access denied: ${role} cannot access ${page}`);
            // Redirect to appropriate dashboard
            window.location.href = this.getDashboard();
            return false;
        }

        return true;
    },

    /**
     * Initialize - runs on page load
     * Does NOT modify page structure, only updates content
     */
    init() {
        const page = window.location.pathname.split('/').pop();

        // Skip on auth pages
        const authPages = ['login.html', 'register.html', 'password-recovery.html', 'onboarding.html', ''];
        if (authPages.includes(page)) return;

        // Check access permission
        if (!this.checkAccess()) return;

        // Update user info in page
        this.updateUserInfo();

        // Add back button if placeholder exists
        this.addBackButton();
    }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Navigation.init());
} else {
    Navigation.init();
}

// Export
window.Navigation = Navigation;
