/**
 * MedClinic Database Simulation (LocalStorage)
 * Simula um banco de dados relacional persistindo em JSON no LocalStorage.
 */

const DB_KEY = 'medclinic_db_v1';

// Seed Data (Dados Iniciais)
const INITIAL_DATA = {
    users: [
        {
            id: 1,
            name: 'Admin Sistema',
            email: 'admin@medclinic.dev',
            password_hash: 'hash_Admin@123', // Em prod seria bcrypt real
            role: 'system_admin',
            cpf: '000.000.000-00',
            phone: '(11) 90000-0000',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Dr. João Santos',
            email: 'joao@medclinic.com',
            password_hash: 'hash_Medico@123',
            role: 'medico',
            cpf: '111.111.111-11',
            phone: '(11) 91111-1111',
            created_at: new Date().toISOString(),
            professional_details: {
                specialty: 'Cardiologia',
                crm: '12345-SP',
                price: 350.00
            }
        },
        {
            id: 3,
            name: 'Maria Silva',
            email: 'maria@paciente.com',
            password_hash: 'hash_Paciente@123',
            role: 'paciente',
            cpf: '222.222.222-22',
            phone: '(11) 92222-2222',
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Recepção Central',
            email: 'recepcao@medclinic.com',
            password_hash: 'hash_Recep@123',
            role: 'recepcionista',
            cpf: '333.333.333-33',
            phone: '(11) 93333-3333',
            created_at: new Date().toISOString()
        }
    ],
    appointments: [],
    transactions: [],
    exam_requests: [],
    availabilities: [
        // Dr. João Santos (Cardiologia) - id: 2
        // Seg (1), Qua (3), Sex (5) - 09:00 às 18:00
        { id: 1, professional_id: 2, day_of_week: 1, start_time: "09:00", end_time: "18:00", is_active: 1 },
        { id: 2, professional_id: 2, day_of_week: 3, start_time: "09:00", end_time: "18:00", is_active: 1 },
        { id: 3, professional_id: 2, day_of_week: 5, start_time: "09:00", end_time: "18:00", is_active: 1 }
    ]
};

const DB = {
    // Inicializa o banco se estiver vazio
    init() {
        if (!localStorage.getItem(DB_KEY)) {
            console.log('DB: Inicializando banco de dados com seed data...');
            this.save(INITIAL_DATA);
        }
    },

    // Lê o estado atual do banco
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(DB_KEY)) || INITIAL_DATA;
        } catch (e) {
            console.error('DB: Erro ao ler dados, resetando...', e);
            this.save(INITIAL_DATA);
            return INITIAL_DATA;
        }
    },

    // Salva o estado completo
    save(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    // ==========================================
    // Table: Users
    // ==========================================

    users: {
        findAll() {
            return DB.getAll().users;
        },

        findByEmail(email) {
            return this.findAll().find(u => u.email === email);
        },

        findById(id) {
            // Conversão para string segura para comparação
            return this.findAll().find(u => String(u.id) === String(id));
        },

        create(user) {
            const db = DB.getAll();
            const newUser = {
                id: Date.now(), // ID pseudo-único
                created_at: new Date().toISOString(),
                ...user
            };

            // Simular hash se não vier
            if (newUser.password && !newUser.password_hash) {
                newUser.password_hash = `hash_${newUser.password}`;
                delete newUser.password;
            }

            db.users.push(newUser);
            DB.save(db);
            return newUser;
        }
    },

    // ==========================================
    // Table: Appointments
    // ==========================================
    appointments: {
        findAll() {
            return DB.getAll().appointments;
        },

        create(appt) {
            const db = DB.getAll();
            const newAppt = {
                id: Date.now(),
                status: 'scheduled',
                created_at: new Date().toISOString(),
                payment_status: 'pending',
                ...appt
            };
            db.appointments.push(newAppt);
            DB.save(db);
            return newAppt;
        }
    },

    // ==========================================
    // Table: Availabilities
    // ==========================================
    availabilities: {
        findAll() {
            return DB.getAll().availabilities;
        },

        findByProfessionalId(professionalId) {
            // Conversão segura para string
            return this.findAll().filter(a => String(a.professional_id) === String(professionalId) && a.is_active === 1);
        }
    }
};

// Auto-init on load
DB.init();

export default DB;
