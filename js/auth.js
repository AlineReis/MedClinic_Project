/**
 * AUTH.JS
 * MedClinic - Gerenciamento de Autenticação
 * Gerencia sessão, token e roles do usuário
 */

const Auth = {
    STORAGE_KEY: 'medclinic_auth',

    /**
     * Roles e suas rotas padrão
     */
    roleRoutes: {
        'patient': 'patient-dashboard.html',
        'receptionist': 'reception-dashboard.html',
        'lab_tech': 'lab-dashboard.html',
        'health_professional': 'doctor-dashboard.html',
        'clinic_admin': 'manager-dashboard.html',
        'system_admin': 'admin-dashboard.html'
    },

    /**
     * Hierarquia de roles (maior número = mais permissões)
     */
    roleHierarchy: {
        'patient': 1,
        'receptionist': 2,
        'lab_tech': 2,
        'health_professional': 3,
        'clinic_admin': 4,
        'system_admin': 5
    },

    /**
     * Simula login (em produção usaria API)
     * @param {string} email
     * @param {string} password
     * @param {string} role
     * @returns {Promise<{success: boolean, user: object, error: string}>}
     */
    async login(email, password, role) {
        // Simula delay de rede
        await new Promise(r => setTimeout(r, 500));

        // Validação básica
        if (!email || !password) {
            return { success: false, error: 'Email e senha são obrigatórios' };
        }

        // Mock de validação (em produção seria API)
        const mockUsers = this._getMockUsers();
        const user = mockUsers.find(u => u.email === email && u.role === role);

        if (!user) {
            return { success: false, error: 'Credenciais inválidas' };
        }

        // Cria sessão
        const session = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: this._generateMockToken(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24h
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

        return { success: true, user: session.user };
    },

    /**
     * Logout - limpa sessão
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = 'login.html';
    },

    /**
     * Verifica se usuário está logado e sessão válida
     * @returns {boolean}
     */
    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;

        // Verifica expiração
        if (Date.now() > session.expiresAt) {
            this.logout();
            return false;
        }

        return true;
    },

    /**
     * Retorna sessão atual
     * @returns {object|null}
     */
    getSession() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Retorna usuário logado
     * @returns {object|null}
     */
    getCurrentUser() {
        const session = this.getSession();
        return session ? session.user : null;
    },

    /**
     * Retorna role do usuário atual
     * @returns {string|null}
     */
    getCurrentRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    /**
     * Verifica se usuário tem permissão mínima
     * @param {string} requiredRole
     * @returns {boolean}
     */
    hasMinRole(requiredRole) {
        const currentRole = this.getCurrentRole();
        if (!currentRole) return false;

        const currentLevel = this.roleHierarchy[currentRole] || 0;
        const requiredLevel = this.roleHierarchy[requiredRole] || 0;

        return currentLevel >= requiredLevel;
    },

    /**
     * Verifica se usuário tem role específico
     * @param {string|string[]} roles
     * @returns {boolean}
     */
    hasRole(roles) {
        const currentRole = this.getCurrentRole();
        if (!currentRole) return false;

        if (Array.isArray(roles)) {
            return roles.includes(currentRole);
        }
        return currentRole === roles;
    },

    /**
     * Protege página - redireciona se não autenticado
     * @param {string|string[]} allowedRoles - Roles permitidos (opcional)
     */
    requireAuth(allowedRoles = null) {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }

        if (allowedRoles && !this.hasRole(allowedRoles)) {
            // Redireciona para dashboard correto do usuário
            const role = this.getCurrentRole();
            window.location.href = this.roleRoutes[role] || 'login.html';
            return false;
        }

        return true;
    },

    /**
     * Redireciona para dashboard correto baseado no role
     */
    redirectToDashboard() {
        const role = this.getCurrentRole();
        const route = this.roleRoutes[role];

        if (route) {
            window.location.href = route;
        } else {
            window.location.href = 'login.html';
        }
    },

    /**
     * Atualiza UI baseado no role (mostra/esconde elementos)
     */
    updateUIForRole() {
        const role = this.getCurrentRole();

        // Esconde elementos não permitidos
        document.querySelectorAll('[data-require-role]').forEach(el => {
            const requiredRoles = el.dataset.requireRole.split(',');
            el.style.display = this.hasRole(requiredRoles) ? '' : 'none';
        });

        // Mostra elementos para role mínimo
        document.querySelectorAll('[data-min-role]').forEach(el => {
            const minRole = el.dataset.minRole;
            el.style.display = this.hasMinRole(minRole) ? '' : 'none';
        });

        // Atualiza nome do usuário onde exibido
        const user = this.getCurrentUser();
        if (user) {
            document.querySelectorAll('[data-user-name]').forEach(el => {
                el.textContent = user.name;
            });
            document.querySelectorAll('[data-user-initials]').forEach(el => {
                el.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2);
            });
        }
    },

    // === HELPERS PRIVADOS ===

    _generateMockToken() {
        return 'MOCK-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    _getMockUsers() {
        return [
            { id: 1, name: 'João Silva', email: 'paciente@medclinic.com', role: 'patient' },
            { id: 2, name: 'Maria Recepção', email: 'recepcao@medclinic.com', role: 'receptionist' },
            { id: 3, name: 'Carlos Lab', email: 'laboratorio@medclinic.com', role: 'lab_tech' },
            { id: 4, name: 'Dra. Camila Rodrigues', email: 'medico@medclinic.com', role: 'health_professional' },
            { id: 5, name: 'Ana Gestora', email: 'gestor@medclinic.com', role: 'clinic_admin' },
            { id: 6, name: 'Admin Sistema', email: 'admin@medclinic.dev', role: 'system_admin' }
        ];
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
} else {
    window.Auth = Auth;
}
