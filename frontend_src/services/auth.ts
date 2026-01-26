import DB from './db';
import Utils from '../utils/validators';

/**
 * Authentication Module
 * Gerencia login, registro e sessão de usuários.
 */
const Auth = {
    // ==========================================
    // Public Methods
    // ==========================================

    async login(email, password) {
        // Encontrar usuário
        const user = DB.users.findByEmail(email);

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!user) {
            throw new Error('Usuário ou senha inválidos');
        }

        // Verificar senha (comparação hash simulada)
        // Nota: Em um sistema real, usamos bcrypt.compare(password, user.password_hash)
        const inputHash = Utils.security.hashPassword(password);

        // Backdoor para usuários de teste legado que podem ter senha plain text no seed antigo (se houver)
        // Mas nosso seed novo já usa hash. 
        if (user.password_hash !== inputHash) {
            throw new Error('Usuário ou senha inválidos');
        }

        // Sucesso: Criar sessão
        const token = this._generateMockToken(user);
        this._saveSession(user, token);

        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            message: 'Login realizado com sucesso'
        };
    },

    async register(userData) {
        // Validações
        if (!Utils.validators.isValidEmail(userData.email)) {
            throw new Error('Email inválido');
        }
        if (!Utils.validators.isValidCPF(userData.cpf)) {
            throw new Error('CPF inválido');
        }
        if (!Utils.validators.isStrongPassword(userData.password)) {
            throw new Error('A senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número');
        }

        // Verificar duplicidade
        const existingEmail = DB.users.findByEmail(userData.email);
        if (existingEmail) {
            throw new Error('Email já cadastrado');
        }

        const allUsers = DB.users.findAll();
        const existingCPF = allUsers.find(u => u.cpf === userData.cpf);
        if (existingCPF) {
            throw new Error('CPF já cadastrado');
        }

        // Criar usuário (Sanitização)
        const newUser = DB.users.create({
            name: userData.name,
            email: userData.email,
            password_hash: Utils.security.hashPassword(userData.password), // Salva hash!
            cpf: userData.cpf.replace(/\D/g, ''), // Salva limpo
            phone: userData.phone,
            role: 'paciente' // Default role
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            user: newUser
        };
    },

    logout() {
        localStorage.removeItem('medclinic_session');
        window.location.reload();
    },

    getCurrentUser() {
        const session = localStorage.getItem('medclinic_session');
        return session ? JSON.parse(session).user : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('medclinic_session');
    },

    // ==========================================
    // Private Helpers
    // ==========================================

    _generateMockToken(user) {
        // Simula estrutura JWT
        return btoa(JSON.stringify({
            id: user.id,
            role: user.role,
            exp: Date.now() + 86400000
        }));
    },

    _saveSession(user, token) {
        const session = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.name.substring(0, 2).toUpperCase()
            },
            token: token,
            created_at: Date.now()
        };
        localStorage.setItem('medclinic_session', JSON.stringify(session));
    }
};

export default Auth;
