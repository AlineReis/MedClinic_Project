/**
 * API.JS
 * MedClinic - Camada de Abstração de API
 * Wrapper para fetch com fallback para mock
 */

const API = {
    BASE_URL: '/api', // Será usado quando backend existir
    USE_MOCK: true,   // Toggle para usar mock ou API real

    /**
     * Headers padrão para requisições
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Adiciona token se autenticado
        const session = window.Auth?.getSession();
        if (session?.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }

        return headers;
    },

    /**
     * Requisição GET
     * @param {string} endpoint
     * @returns {Promise<object>}
     */
    async get(endpoint) {
        if (this.USE_MOCK) {
            return this._mockRequest('GET', endpoint);
        }

        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this._handleResponse(response);
    },

    /**
     * Requisição POST
     * @param {string} endpoint
     * @param {object} data
     * @returns {Promise<object>}
     */
    async post(endpoint, data) {
        if (this.USE_MOCK) {
            return this._mockRequest('POST', endpoint, data);
        }

        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });

        return this._handleResponse(response);
    },

    /**
     * Requisição PUT
     * @param {string} endpoint
     * @param {object} data
     * @returns {Promise<object>}
     */
    async put(endpoint, data) {
        if (this.USE_MOCK) {
            return this._mockRequest('PUT', endpoint, data);
        }

        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });

        return this._handleResponse(response);
    },

    /**
     * Requisição DELETE
     * @param {string} endpoint
     * @returns {Promise<object>}
     */
    async delete(endpoint) {
        if (this.USE_MOCK) {
            return this._mockRequest('DELETE', endpoint);
        }

        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        return this._handleResponse(response);
    },

    /**
     * Processa resposta da API
     */
    async _handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },

    /**
     * Mock de requisições (usa window.db)
     */
    async _mockRequest(method, endpoint, data = null) {
        // Simula latência de rede
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

        const db = window.db;
        if (!db) {
            throw new Error('Mock database not initialized');
        }

        // === APPOINTMENTS ===
        if (endpoint === '/appointments') {
            if (method === 'GET') return { data: db.getAppointments() };
            if (method === 'POST') return { data: db.createAppointment(data) };
        }

        if (endpoint.match(/^\/appointments\/\d+$/)) {
            const id = parseInt(endpoint.split('/')[2]);
            if (method === 'GET') return { data: db.getAppointment(id) };
            if (method === 'PUT') return { data: db.updateAppointment(id, data) };
            if (method === 'DELETE') return { data: db.deleteAppointment(id) };
        }

        // === DOCTORS ===
        if (endpoint === '/doctors') {
            if (method === 'GET') return { data: db.getDoctors() };
        }

        // === PATIENTS ===
        if (endpoint === '/patients') {
            if (method === 'GET') return { data: db.getPatients() };
        }

        if (endpoint.match(/^\/patients\/\d+$/)) {
            const id = parseInt(endpoint.split('/')[2]);
            if (method === 'GET') return { data: db.getPatient(id) };
        }

        // === EXAMS ===
        if (endpoint === '/exams') {
            if (method === 'GET') return { data: db.getExams() };
            if (method === 'POST') return { data: db.createExam(data) };
        }

        // === PRESCRIPTIONS ===
        if (endpoint === '/prescriptions') {
            if (method === 'GET') return { data: db.getPrescriptions() };
            if (method === 'POST') return { data: db.createPrescription(data) };
        }

        // === TRANSACTIONS ===
        if (endpoint === '/transactions') {
            if (method === 'GET') return { data: db.getTransactions() };
        }

        // === PAYMENTS (CloudWalk Mock) ===
        if (endpoint === '/payments/process') {
            if (method === 'POST') return { data: db.processPayment(data) };
        }

        // Endpoint não encontrado
        throw new Error(`Mock endpoint not found: ${method} ${endpoint}`);
    }
};

// Atalhos convenientes
const api = {
    // Appointments
    getAppointments: () => API.get('/appointments'),
    getAppointment: (id) => API.get(`/appointments/${id}`),
    createAppointment: (data) => API.post('/appointments', data),
    updateAppointment: (id, data) => API.put(`/appointments/${id}`, data),
    cancelAppointment: (id, reason) => API.put(`/appointments/${id}`, { status: 'cancelled', reason }),

    // Doctors
    getDoctors: () => API.get('/doctors'),

    // Patients
    getPatients: () => API.get('/patients'),
    getPatient: (id) => API.get(`/patients/${id}`),

    // Exams
    getExams: () => API.get('/exams'),
    createExam: (data) => API.post('/exams', data),

    // Prescriptions
    getPrescriptions: () => API.get('/prescriptions'),
    createPrescription: (data) => API.post('/prescriptions', data),

    // Payments
    processPayment: (data) => API.post('/payments/process', data),

    // Transactions
    getTransactions: () => API.get('/transactions')
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, api };
} else {
    window.API = API;
    window.api = api;
}
