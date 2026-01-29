/**
 * MOCK DATABASE
 * MedClinic - Simulates a backend database for the prototype.
 * Data is persisted in localStorage to maintain state across reloads.
 * Enhanced with complete CRUD, exams, prescriptions, and transactions.
 */

// ========== INITIAL DATA ==========

const INITIAL_DOCTORS = [
    {
        id: 1,
        name: "Drª. Camila Rodrigues",
        specialty: "Cardiologia",
        crm: "CRM/SP 123456",
        rating: 4.9,
        email: "cardio@clinica.com",
        duration: 30,
        price: 350.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmnbbvRP02hJ7H_zoaKaRiRNKJX1-HGCsPGr0jtGdC-Z-RpxW0PIC4hi9UbGZECqEBJgvX6kMZNaB2B-qtgQq3Y7WLn0d-KK6i7UtIkQtipVRaZzxGHwaTJaOLH3RhQ5bfFecerS4T715D_V5jKKKvdukxXs1GuE__XOYOLbfHkbkHEBnm_9D6hV48EX-iJ-0NFcO0cZF6_ht4OP3GgN7FJhsNpMYNE3d80axsU_5euQIG_v1YcDFmISo1Mk1KGAX6Tmr8oFiyAWo",
        location: "Jardins",
        insurance: ["Unimed", "Bradesco", "Particular"],
        slots: ["14:00", "14:30", "15:00", "16:15", "17:00"]
    },
    {
        id: 2,
        name: "Dr. Ricardo Silva",
        specialty: "Dermatologia",
        crm: "CRM/SP 859201",
        rating: 5.0,
        email: "dermato@clinica.com",
        duration: 30,
        price: 300.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw7AIAzJMm19IxuK-WzejXXdj92pmmKgtBHgOSNQjo_gMCqlqI_PI7xCwSxPUA_-btgWSgnYA6-0jmMTe0gCIRhEspI5uO15vhB8xvliMrJQw-qMiSO4mAJL3l3c13wphA-xAxNUKt4ssKrdztsv51E_jFTfQ6PU8iX-AndSwN1kwkySruql8IqRF-7Xu43HBBUxC9pRdpyhTVgyoUqlSX6TqEVVh6H2gnbPhfBQEXKFoZ5VxHx-EhQvmzcr7Knvf8Z-nRSQ9wv3g",
        location: "Centro",
        insurance: ["SulAmérica", "Particular"],
        slots: ["09:30", "10:00", "11:30"]
    },
    {
        id: 3,
        name: "Drª. Mariana Costa",
        specialty: "Endocrinologia",
        crm: "CRM/SP 440291",
        rating: 4.8,
        email: "endo@clinica.com",
        duration: 45,
        price: 320.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbo4yXUmceHBJBEmf908pxy8qtjKKyPLzzKMp-WKXZLWIBH4VCkdBoQDbrVniyzKCuPUagzZiLyPBULFvVc2XjpZyT5_IIJC3Jk5AgjYNPNkOqfFdEhnhWyYgrC_bYxTQd8VwYqjKB8ScMPlqSthCpYJdA2qEzP3uYYsRZRtHnR28mXcyP4QXgq_EyKqoILXEHRlzo_65iyx71LZsmqUwnYkJtlDpsx430Y32BLRQHRlOCxuXcNXecp3Hhn0lG_TDnWL3qIuTyI54",
        location: "Jardins",
        insurance: ["Unimed", "Particular"],
        slots: []
    },
    {
        id: 4,
        name: "Dr. Paulo Mendes",
        specialty: "Ortopedia",
        crm: "CRM/SP 992102",
        rating: 4.7,
        email: "ortopedista@clinica.com",
        duration: 30,
        price: 280.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC73BoMotd_75XnEy9byJr6VRMKw4t2XphSyTlgxqxgsNgXUaU9G8bA9Cv-k-I8ZUnrG4hkxZ59CwvQohGr21Dx9WQhWjTPYkEFNhLQI7YtdqVlVXceoOBGqB4Qp8fyEbNJ9hT64_VWvf5ZO2O-aP6B5i2gG6FkF3d-ZfvAHC-VXEvcYjSwojsTwjkEa5Zk9PBCfzhPA0QZnNn-xrZJeMkxlXLFmCLsOGs8-uafmM1pPkliFRTryziYW6_zxDovyHOZK9duSEEKeuQ",
        location: "Barra",
        insurance: ["Reembolso", "Particular"],
        slots: ["13:00", "13:45", "15:30", "16:00"]
    },
    {
        id: 5,
        name: "Dr. Fernando Psico",
        specialty: "Psicologia",
        crm: "CRP 06/12345",
        rating: 4.9,
        email: "psicologo@clinica.com",
        duration: 50,
        price: 120.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC73BoMotd_75XnEy9byJr6VRMKw4t2XphSyTlgxqxgsNgXUaU9G8bA9Cv-k-I8ZUnrG4hkxZ59CwvQohGr21Dx9WQhWjTPYkEFNhLQI7YtdqVlVXceoOBGqB4Qp8fyEbNJ9hT64_VWvf5ZO2O-aP6B5i2gG6FkF3d-ZfvAHC-VXEvcYjSwojsTwjkEa5Zk9PBCfzhPA0QZnNn-xrZJeMkxlXLFmCLsOGs8-uafmM1pPkliFRTryziYW6_zxDovyHOZK9duSEEKeuQ",
        location: "Centro",
        insurance: ["Particular"],
        slots: ["08:00", "09:00", "10:00", "11:00"]
    }
];

const INITIAL_PATIENTS = [
    {
        id: 1,
        name: "Maria Silva Santos",
        email: "maria@email.com",
        age: 34,
        gender: "Feminino",
        cpf: "123.456.789-00",
        phone: "(11) 99999-1234",
        insurance: "SulAmérica (Premium)",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSkuKBbqqKWbvtTjpKD12gxhWjFf73F7HEkdEDykn9Oewvnv_zGLzPcEy1cH4Cw8olbai2P8m8noPkC1LNRyj-Y2hwaGZ0IPqSu7cadQ5iQDdf9fBM2Vh7B3lU0AZ32CiuhQZatjpJY632ACiQ69rJ9XhLrK_7uH6grTqUxv80lR-K_G5ZjbkxW5xKXjvpEZd-3Z7f5Gwvlup1fdeWKqj4si0_mitLoJgxVSeXb7vttBMLjNCfvpY_T26Dqcap7VrQ-jMPC95-p8I",
        vitals: { height: "172 cm", weight: "68 kg", blood: "O+", pressure: "120/80" },
        allergies: ["Penicilina"],
        conditions: ["Hipertensão Leve"]
    },
    {
        id: 2,
        name: "João Pereira",
        email: "joao@email.com",
        age: 45,
        gender: "Masculino",
        cpf: "987.654.321-00",
        phone: "(11) 98888-5678",
        insurance: "Unimed",
        vitals: { height: "178 cm", weight: "82 kg", blood: "A+", pressure: "130/85" },
        allergies: [],
        conditions: ["Diabetes Tipo 2"]
    },
    {
        id: 3,
        name: "Ana Lucia Ferreira",
        email: "ana@email.com",
        age: 28,
        gender: "Feminino",
        cpf: "456.789.123-00",
        phone: "(11) 97777-9012",
        insurance: "Bradesco",
        vitals: { height: "165 cm", weight: "55 kg", blood: "B-", pressure: "110/70" },
        allergies: ["Dipirona"],
        conditions: []
    }
];

const INITIAL_APPOINTMENTS = [
    {
        id: 1001,
        patient_id: 1,
        patient_name: "Maria Silva Santos",
        professional_id: 1,
        professional_name: "Drª. Camila Rodrigues",
        specialty: "Cardiologia",
        date: "2026-01-28",
        time: "14:30",
        type: "presencial",
        status: "scheduled",
        price: 350.00,
        room: "Sala 3",
        notes: "",
        created_at: "2026-01-26T10:00:00Z"
    },
    {
        id: 1002,
        patient_id: 2,
        patient_name: "João Pereira",
        professional_id: 3,
        professional_name: "Drª. Mariana Costa",
        specialty: "Endocrinologia",
        date: "2026-01-28",
        time: "15:00",
        type: "presencial",
        status: "waiting",
        price: 320.00,
        room: "Sala 1",
        notes: "Retorno - acompanhamento glicemia",
        created_at: "2026-01-20T14:30:00Z"
    },
    {
        id: 1003,
        patient_id: 3,
        patient_name: "Ana Lucia Ferreira",
        professional_id: 5,
        professional_name: "Dr. Fernando Psico",
        specialty: "Psicologia",
        date: "2026-01-28",
        time: "10:00",
        type: "online",
        status: "completed",
        price: 120.00,
        room: null,
        notes: "Sessão de terapia semanal",
        created_at: "2026-01-15T09:00:00Z"
    }
];

const INITIAL_EXAMS = [
    {
        id: 2001,
        patient_id: 1,
        patient_name: "Maria Silva Santos",
        requesting_professional_id: 1,
        requesting_professional_name: "Drª. Camila Rodrigues",
        exam_type: "blood",
        exam_name: "Hemograma Completo",
        clinical_indication: "Acompanhamento rotina cardiovascular",
        status: "ready",
        price: 45.00,
        result_url: null,
        scheduled_date: "2026-01-25",
        released_at: "2026-01-26T08:00:00Z",
        created_at: "2026-01-20T10:00:00Z"
    },
    {
        id: 2002,
        patient_id: 1,
        patient_name: "Maria Silva Santos",
        requesting_professional_id: 1,
        requesting_professional_name: "Drª. Camila Rodrigues",
        exam_type: "image",
        exam_name: "Ecocardiograma",
        clinical_indication: "Avaliação função cardíaca",
        status: "in_analysis",
        price: 280.00,
        result_url: null,
        scheduled_date: "2026-01-27",
        released_at: null,
        created_at: "2026-01-22T14:00:00Z"
    },
    {
        id: 2003,
        patient_id: 2,
        patient_name: "João Pereira",
        requesting_professional_id: 3,
        requesting_professional_name: "Drª. Mariana Costa",
        exam_type: "blood",
        exam_name: "Glicemia de Jejum + HbA1c",
        clinical_indication: "Controle diabetes",
        status: "pending_payment",
        price: 65.00,
        result_url: null,
        scheduled_date: null,
        released_at: null,
        created_at: "2026-01-27T09:00:00Z"
    }
];

const INITIAL_PRESCRIPTIONS = [
    {
        id: 3001,
        patient_id: 1,
        patient_name: "Maria Silva Santos",
        professional_id: 1,
        professional_name: "Drª. Camila Rodrigues",
        date: "2026-01-20",
        medications: [
            { name: "Losartana 50mg", dosage: "1 comprimido", frequency: "12/12h", duration: "Uso contínuo" },
            { name: "AAS 100mg", dosage: "1 comprimido", frequency: "1x ao dia", duration: "Uso contínuo" }
        ],
        notes: "Manter dieta hipossódica. Retorno em 3 meses.",
        is_digital: true,
        status: "active",
        created_at: "2026-01-20T11:00:00Z"
    },
    {
        id: 3002,
        patient_id: 2,
        patient_name: "João Pereira",
        professional_id: 3,
        professional_name: "Drª. Mariana Costa",
        date: "2026-01-15",
        medications: [
            { name: "Metformina 850mg", dosage: "1 comprimido", frequency: "2x ao dia", duration: "Uso contínuo" }
        ],
        notes: "Tomar após refeições. Manter controle glicêmico.",
        is_digital: true,
        status: "active",
        created_at: "2026-01-15T16:00:00Z"
    }
];

const INITIAL_TRANSACTIONS = [
    {
        id: 4001,
        appointment_id: 1003,
        patient_id: 3,
        patient_name: "Ana Lucia Ferreira",
        professional_id: 5,
        professional_name: "Dr. Fernando Psico",
        type: "consultation",
        gross_amount: 120.00,
        mdr_fee: 4.55,
        net_amount: 115.45,
        split: { professional: 69.27, clinic: 40.41, system: 5.77 },
        payment_method: "credit_card",
        installments: 1,
        status: "paid",
        cloudwalk_id: "CW-MOCK-001",
        paid_at: "2026-01-28T09:55:00Z",
        created_at: "2026-01-28T09:55:00Z"
    },
    {
        id: 4002,
        appointment_id: 1001,
        patient_id: 1,
        patient_name: "Maria Silva Santos",
        professional_id: 1,
        professional_name: "Drª. Camila Rodrigues",
        type: "consultation",
        gross_amount: 350.00,
        mdr_fee: 13.27,
        net_amount: 336.73,
        split: { professional: 202.04, clinic: 117.86, system: 16.84 },
        payment_method: "credit_card",
        installments: 2,
        status: "paid",
        cloudwalk_id: "CW-MOCK-002",
        paid_at: "2026-01-26T10:05:00Z",
        created_at: "2026-01-26T10:05:00Z"
    },
    {
        id: 4003,
        exam_id: 2001,
        patient_id: 1,
        patient_name: "Maria Silva Santos",
        type: "exam",
        gross_amount: 45.00,
        mdr_fee: 1.71,
        net_amount: 43.29,
        split: { clinic: 43.29 },
        payment_method: "pix",
        installments: 1,
        status: "paid",
        cloudwalk_id: "CW-MOCK-003",
        paid_at: "2026-01-20T10:10:00Z",
        created_at: "2026-01-20T10:10:00Z"
    }
];

// ========== MOCK DATABASE CLASS ==========

class MockDB {
    constructor() {
        this.init();
    }

    init() {
        // Initialize all collections if not present
        this._initCollection('medclinic_doctors', INITIAL_DOCTORS);
        this._initCollection('medclinic_patients', INITIAL_PATIENTS);
        this._initCollection('medclinic_appointments', INITIAL_APPOINTMENTS);
        this._initCollection('medclinic_exams', INITIAL_EXAMS);
        this._initCollection('medclinic_prescriptions', INITIAL_PRESCRIPTIONS);
        this._initCollection('medclinic_transactions', INITIAL_TRANSACTIONS);
    }

    _initCollection(key, initialData) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(initialData));
        }
    }

    _getCollection(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    _setCollection(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    _generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    // ========== DOCTORS ==========
    getDoctors() {
        return this._getCollection('medclinic_doctors');
    }

    getDoctor(id) {
        return this.getDoctors().find(d => d.id === id);
    }

    getDoctorsBySpecialty(specialty) {
        return this.getDoctors().filter(d =>
            d.specialty.toLowerCase().includes(specialty.toLowerCase())
        );
    }

    // ========== PATIENTS ==========
    getPatients() {
        return this._getCollection('medclinic_patients');
    }

    getPatient(id) {
        const patients = this.getPatients();
        return patients.find(p => p.id === id || p.name.includes(id));
    }

    createPatient(data) {
        const patients = this.getPatients();
        const newPatient = {
            id: this._generateId(),
            ...data,
            vitals: data.vitals || {},
            allergies: data.allergies || [],
            conditions: data.conditions || [],
            created_at: new Date().toISOString()
        };
        patients.push(newPatient);
        this._setCollection('medclinic_patients', patients);
        return newPatient;
    }

    updatePatient(id, data) {
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id === id);
        if (index === -1) return null;

        patients[index] = { ...patients[index], ...data, updated_at: new Date().toISOString() };
        this._setCollection('medclinic_patients', patients);
        return patients[index];
    }

    // ========== APPOINTMENTS ==========
    getAppointments() {
        return this._getCollection('medclinic_appointments');
    }

    getAppointment(id) {
        return this.getAppointments().find(a => a.id === id);
    }

    getAppointmentsByPatient(patientId) {
        return this.getAppointments().filter(a => a.patient_id === patientId);
    }

    getAppointmentsByProfessional(professionalId) {
        return this.getAppointments().filter(a => a.professional_id === professionalId);
    }

    getAppointmentsByDate(date) {
        return this.getAppointments().filter(a => a.date === date);
    }

    getAppointmentsByStatus(status) {
        return this.getAppointments().filter(a => a.status === status);
    }

    createAppointment(data) {
        const appointments = this.getAppointments();

        // Get doctor and patient info
        const doctor = this.getDoctor(data.professional_id);
        const patient = this.getPatient(data.patient_id);

        const newAppointment = {
            id: this._generateId(),
            patient_name: patient?.name || data.patient_name,
            professional_name: doctor?.name || data.professional_name,
            specialty: doctor?.specialty || data.specialty,
            status: 'scheduled',
            room: null,
            notes: '',
            ...data,
            created_at: new Date().toISOString()
        };

        appointments.push(newAppointment);
        this._setCollection('medclinic_appointments', appointments);
        return newAppointment;
    }

    updateAppointment(id, data) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === id);
        if (index === -1) return null;

        appointments[index] = {
            ...appointments[index],
            ...data,
            updated_at: new Date().toISOString()
        };
        this._setCollection('medclinic_appointments', appointments);
        return appointments[index];
    }

    deleteAppointment(id) {
        const appointments = this.getAppointments();
        const filtered = appointments.filter(a => a.id !== id);
        this._setCollection('medclinic_appointments', filtered);
        return { success: true };
    }

    // ========== EXAMS ==========
    getExams() {
        return this._getCollection('medclinic_exams');
    }

    getExam(id) {
        return this.getExams().find(e => e.id === id);
    }

    getExamsByPatient(patientId) {
        return this.getExams().filter(e => e.patient_id === patientId);
    }

    getExamsByStatus(status) {
        return this.getExams().filter(e => e.status === status);
    }

    createExam(data) {
        const exams = this.getExams();
        const patient = this.getPatient(data.patient_id);
        const doctor = this.getDoctor(data.requesting_professional_id);

        const newExam = {
            id: this._generateId(),
            patient_name: patient?.name || data.patient_name,
            requesting_professional_name: doctor?.name || data.requesting_professional_name,
            status: 'pending_payment',
            result_url: null,
            scheduled_date: null,
            released_at: null,
            ...data,
            created_at: new Date().toISOString()
        };

        exams.push(newExam);
        this._setCollection('medclinic_exams', exams);
        return newExam;
    }

    updateExam(id, data) {
        const exams = this.getExams();
        const index = exams.findIndex(e => e.id === id);
        if (index === -1) return null;

        exams[index] = { ...exams[index], ...data, updated_at: new Date().toISOString() };
        this._setCollection('medclinic_exams', exams);
        return exams[index];
    }

    releaseExamResult(id, resultUrl) {
        return this.updateExam(id, {
            status: 'released',
            result_url: resultUrl,
            released_at: new Date().toISOString()
        });
    }

    // ========== PRESCRIPTIONS ==========
    getPrescriptions() {
        return this._getCollection('medclinic_prescriptions');
    }

    getPrescription(id) {
        return this.getPrescriptions().find(p => p.id === id);
    }

    getPrescriptionsByPatient(patientId) {
        return this.getPrescriptions().filter(p => p.patient_id === patientId);
    }

    createPrescription(data) {
        const prescriptions = this.getPrescriptions();
        const patient = this.getPatient(data.patient_id);
        const doctor = this.getDoctor(data.professional_id);

        const newPrescription = {
            id: this._generateId(),
            patient_name: patient?.name || data.patient_name,
            professional_name: doctor?.name || data.professional_name,
            date: new Date().toISOString().split('T')[0],
            medications: data.medications || [],
            notes: data.notes || '',
            is_digital: true,
            status: 'active',
            ...data,
            created_at: new Date().toISOString()
        };

        prescriptions.push(newPrescription);
        this._setCollection('medclinic_prescriptions', prescriptions);
        return newPrescription;
    }

    // ========== TRANSACTIONS ==========
    getTransactions() {
        return this._getCollection('medclinic_transactions');
    }

    getTransaction(id) {
        return this.getTransactions().find(t => t.id === id);
    }

    getTransactionsByPatient(patientId) {
        return this.getTransactions().filter(t => t.patient_id === patientId);
    }

    getTransactionsByProfessional(professionalId) {
        return this.getTransactions().filter(t => t.professional_id === professionalId);
    }

    getTransactionsByStatus(status) {
        return this.getTransactions().filter(t => t.status === status);
    }

    createTransaction(data) {
        const transactions = this.getTransactions();

        // Calculate MDR and split (RN-18)
        const mdrRate = 0.0379;
        const gross = data.gross_amount || data.amount;
        const mdrFee = Math.round(gross * mdrRate * 100) / 100;
        const net = gross - mdrFee;

        const newTransaction = {
            id: this._generateId(),
            gross_amount: gross,
            mdr_fee: mdrFee,
            net_amount: net,
            split: {
                professional: Math.round(net * 0.60 * 100) / 100,
                clinic: Math.round(net * 0.35 * 100) / 100,
                system: Math.round(net * 0.05 * 100) / 100
            },
            status: 'pending',
            cloudwalk_id: null,
            paid_at: null,
            ...data,
            created_at: new Date().toISOString()
        };

        transactions.push(newTransaction);
        this._setCollection('medclinic_transactions', transactions);
        return newTransaction;
    }

    // ========== PAYMENTS (CloudWalk Mock) ==========
    processPayment(data) {
        // Simulates CloudWalk API
        const success = Math.random() > 0.05; // 95% success rate

        if (!success) {
            return {
                success: false,
                error: 'Pagamento recusado pela operadora',
                code: 'DECLINED'
            };
        }

        // Create transaction
        const transaction = this.createTransaction({
            ...data,
            status: 'paid',
            cloudwalk_id: 'CW-MOCK-' + Date.now(),
            paid_at: new Date().toISOString()
        });

        // Update related entity (appointment or exam)
        if (data.appointment_id) {
            this.updateAppointment(data.appointment_id, { payment_status: 'paid' });
        }
        if (data.exam_id) {
            this.updateExam(data.exam_id, { status: 'paid_pending_schedule' });
        }

        return {
            success: true,
            transaction_id: transaction.id,
            cloudwalk_id: transaction.cloudwalk_id,
            receipt_url: `#receipt-${transaction.id}`
        };
    }

    // ========== STATS & DASHBOARD ==========
    getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const appointments = this.getAppointments();
        const exams = this.getExams();
        const transactions = this.getTransactions();

        return {
            todayAppointments: appointments.filter(a => a.date === today).length,
            waitingPatients: appointments.filter(a => a.status === 'waiting').length,
            pendingExams: exams.filter(e => e.status === 'in_analysis').length,
            todayRevenue: transactions
                .filter(t => t.paid_at && t.paid_at.startsWith(today))
                .reduce((sum, t) => sum + t.gross_amount, 0)
        };
    }

    // ========== RESET ==========
    resetDatabase() {
        localStorage.removeItem('medclinic_doctors');
        localStorage.removeItem('medclinic_patients');
        localStorage.removeItem('medclinic_appointments');
        localStorage.removeItem('medclinic_exams');
        localStorage.removeItem('medclinic_prescriptions');
        localStorage.removeItem('medclinic_transactions');
        this.init();
        return { success: true, message: 'Database reset to initial state' };
    }
}

// Global instance
window.db = new MockDB();
