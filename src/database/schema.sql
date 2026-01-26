-- =============================================================================
-- MedClinic Database Schema
-- Sistema de Gestao de Clinicas Medicas
-- Versao: 1.0 | Data: Janeiro 2026
-- =============================================================================

-- Habilitar foreign keys (deve ser executado em cada conexao)
PRAGMA foreign_keys = ON;

-- =============================================================================
-- BLOCO 1: USUARIOS E PROFISSIONAIS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: users
-- Proposito: Armazena todos os usuarios do sistema com seus dados basicos
-- e controle de acesso (6 roles diferentes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- SEMPRE hash bcrypt, nunca texto plano
    role TEXT NOT NULL CHECK (role IN (
        'patient',
        'receptionist',
        'lab_tech',
        'health_professional',
        'clinic_admin',
        'system_admin'
    )),
    cpf TEXT UNIQUE,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

-- Trigger: Valida campos obrigatorios para roles especificas
-- RN: Pacientes e Profissionais DEVEM ter CPF.
-- RN: Pacientes DEVEM ter Telefone.
CREATE TRIGGER IF NOT EXISTS trg_users_validate_role_requirements
BEFORE INSERT ON users
BEGIN
    SELECT
        CASE
            WHEN (NEW.role IN ('patient', 'health_professional', 'receptionist') AND NEW.cpf IS NULL) THEN
                RAISE(ABORT, 'CPF is required for this user role')
            WHEN (NEW.role = 'patient' AND NEW.phone IS NULL) THEN
                RAISE(ABORT, 'Phone number is required for patients')
        END;
END;

-- Mesma validacao para UPDATE
CREATE TRIGGER IF NOT EXISTS trg_users_validate_role_requirements_update
BEFORE UPDATE ON users
BEGIN
    SELECT
        CASE
            WHEN (NEW.role IN ('patient', 'health_professional', 'receptionist') AND NEW.cpf IS NULL) THEN
                RAISE(ABORT, 'CPF is required for this user role')
            WHEN (NEW.role = 'patient' AND NEW.phone IS NULL) THEN
                RAISE(ABORT, 'Phone number is required for patients')
        END;
END;

-- -----------------------------------------------------------------------------
-- Tabela: professional_details
-- Proposito: Estende a tabela users com informacoes especificas de
-- profissionais de saude (especialidade, CRM, precificacao)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS professional_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    specialty TEXT NOT NULL CHECK (specialty IN (
        'psicologia',
        'nutricao',
        'fonoaudiologia',
        'fisioterapia',
        'clinica_medica',
        'cardiologia',
        'oftalmologia',
        'urologia',
        'cirurgia_geral',
        'ortopedia',
        'neurologia'
    )),
    registration_number TEXT NOT NULL, -- CRM, CRP, etc.
    council TEXT, -- Conselho Regional
    consultation_price REAL NOT NULL CHECK (consultation_price > 0),
    commission_percentage REAL DEFAULT 60.00 CHECK (
        commission_percentage >= 0 AND commission_percentage <= 100
    ),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Tabela: availabilities
-- Proposito: Define a agenda semanal de cada profissional
-- RN-01: Disponibilidade de Horarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professional_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    start_time TEXT NOT NULL, -- Formato "HH:MM"
    end_time TEXT NOT NULL, -- Formato "HH:MM"
    is_active INTEGER DEFAULT 1, -- 0=inativo, 1=ativo
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (start_time < end_time)
);

-- =============================================================================
-- BLOCO 2: CONSULTAS (CORE DO SISTEMA)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: appointments
-- Proposito: Registra todas as consultas agendadas, seus status e pagamentos
-- com preco CONGELADO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    professional_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- Formato YYYY-MM-DD
    time TEXT NOT NULL, -- Formato HH:MM
    duration_minutes INTEGER DEFAULT 30,
    type TEXT NOT NULL CHECK (type IN ('presencial', 'online')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'confirmed',
        'waiting',
        'in_progress',
        'completed',
        'no_show',
        'cancelled_by_patient',
        'cancelled_by_clinic',
        'rescheduled'
    )),
    price REAL NOT NULL CHECK (price >= 0), -- Preco CONGELADO no momento do agendamento
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending',
        'processing',
        'paid',
        'failed',
        'refunded',
        'partially_refunded'
    )),
    video_link TEXT, -- Para consultas online
    room_number TEXT, -- Para consultas presenciais
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Trigger: Garante que agendamentos so podem ser criados para datas futuras
-- Substitui CHECK (date >= date('now')) para permitir updates antigos
CREATE TRIGGER IF NOT EXISTS trg_appointments_insert_date_check
BEFORE INSERT ON appointments
BEGIN
    SELECT
        CASE
            WHEN NEW.date < date('now') THEN
                RAISE(ABORT, 'Appointments cannot be scheduled in the past')
        END;
END;

-- =============================================================================
-- BLOCO 3: EXAMES E PRESCRICOES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: exam_catalog
-- Proposito: Catalogo padronizado de exames
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('blood', 'image')),
    base_price REAL NOT NULL CHECK (base_price > 0),
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

-- -----------------------------------------------------------------------------
-- Tabela: exam_requests
-- Proposito: Requisicoes de exame solicitadas por profissionais
-- RN-09: Pedido medico obrigatorio (clinical_indication NOT NULL)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    requesting_professional_id INTEGER NOT NULL,
    exam_catalog_id INTEGER NOT NULL,
    clinical_indication TEXT NOT NULL, -- RN-09: Justificativa obrigatoria
    price REAL NOT NULL CHECK (price >= 0), -- Preco CONGELADO do catalogo
    status TEXT DEFAULT 'pending_payment' CHECK (status IN (
        'pending_payment',
        'paid',
        'scheduled',
        'sample_collected',
        'processing',
        'ready',
        'delivered',
        'cancelled'
    )),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending',
        'processing',
        'paid',
        'failed',
        'refunded'
    )),
    scheduled_date TEXT,
    result_file_url TEXT,
    result_text TEXT,
    lab_tech_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (requesting_professional_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (exam_catalog_id) REFERENCES exam_catalog(id) ON DELETE RESTRICT,
    FOREIGN KEY (lab_tech_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- Tabela: prescriptions
-- Proposito: Armazena prescricoes digitais emitidas durante consultas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    professional_id INTEGER NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    instructions TEXT,
    is_controlled INTEGER DEFAULT 0, -- 0=nao controlado, 1=controlado
    pdf_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================================================
-- BLOCO 4: FINANCEIRO (PAGAMENTOS E COMISSIONAMENTO)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela: transactions
-- Proposito: Registra TODA transacao financeira com valores brutos, MDR e liquidos
-- RN-17: Apenas ultimos 4 digitos do cartao (card_last4)
-- MDR: 3.79% (CloudWalk)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN (
        'appointment_payment',
        'exam_payment',
        'refund'
    )),
    reference_id INTEGER NOT NULL,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('appointment', 'exam')),
    payer_id INTEGER NOT NULL,
    amount_gross REAL NOT NULL CHECK (amount_gross >= 0),
    mdr_fee REAL NOT NULL CHECK (mdr_fee >= 0), -- 3.79% do valor bruto
    amount_net REAL NOT NULL CHECK (amount_net >= 0), -- amount_gross - mdr_fee
    installments INTEGER DEFAULT 1 CHECK (installments >= 1),
    payment_method TEXT DEFAULT 'credit_card' CHECK (payment_method IN (
        'credit_card',
        'debit_card',
        'pix',
        'boleto'
    )),
    gateway_transaction_id TEXT,
    card_brand TEXT,
    card_last4 TEXT CHECK (length(card_last4) = 4 OR card_last4 IS NULL), -- RN-17
    status TEXT DEFAULT 'processing' CHECK (status IN (
        'processing',
        'paid',
        'failed',
        'refunded',
        'partially_refunded'
    )),
    processed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- Tabela: commission_splits
-- Proposito: Rastreia divisao de cada transacao
-- Profissional: 60% | Clinica: 35% | Sistema: 5%
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    recipient_id INTEGER, -- NULL para 'system' e 'clinic'
    recipient_type TEXT NOT NULL CHECK (recipient_type IN (
        'professional',
        'clinic',
        'system'
    )),
    percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    amount REAL NOT NULL CHECK (amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'paid',
        'failed'
    )),
    paid_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- Tabela: refunds
-- Proposito: Registra reembolsos
-- RN-21: >24h = 100% reembolso
-- RN-22: <24h = 70% reembolso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    amount_refunded REAL NOT NULL CHECK (amount_refunded > 0),
    reason TEXT NOT NULL,
    requested_by INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed'
    )),
    processed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- Tabela: monthly_reports
-- Proposito: Relatorios mensais de comissao
-- RN-28: Repasse ate dia 10 do mes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professional_id INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    total_appointments INTEGER DEFAULT 0,
    total_gross_amount REAL DEFAULT 0,
    total_net_amount REAL DEFAULT 0,
    total_commission REAL DEFAULT 0,
    total_deductions REAL DEFAULT 0,
    amount_to_receive REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'generated' CHECK (payment_status IN (
        'generated',
        'pending',
        'processing',
        'paid',
        'failed'
    )),
    payment_date TEXT,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE (professional_id, month, year)
);

-- =============================================================================
-- INDICES ESTRATEGICOS PARA PERFORMANCE
-- =============================================================================

-- Indices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Indices para professional_details
CREATE INDEX IF NOT EXISTS idx_professional_details_user_id ON professional_details(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_details_specialty ON professional_details(specialty);

-- Indices para availabilities
CREATE INDEX IF NOT EXISTS idx_availabilities_professional_id ON availabilities(professional_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_day_of_week ON availabilities(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availabilities_active ON availabilities(is_active);

-- Indices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_professional ON appointments(date, professional_id);

-- Indices para exam_catalog
CREATE INDEX IF NOT EXISTS idx_exam_catalog_type ON exam_catalog(type);
CREATE INDEX IF NOT EXISTS idx_exam_catalog_active ON exam_catalog(is_active);

-- Indices para exam_requests
CREATE INDEX IF NOT EXISTS idx_exam_requests_appointment_id ON exam_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_patient_id ON exam_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_professional_id ON exam_requests(requesting_professional_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_status ON exam_requests(status);

-- Indices para prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_professional_id ON prescriptions(professional_id);

-- Indices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Indices para commission_splits
CREATE INDEX IF NOT EXISTS idx_commission_splits_transaction_id ON commission_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_splits_recipient ON commission_splits(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_commission_splits_status ON commission_splits(status);

-- Indices para refunds
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_by ON refunds(requested_by);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Indices para monthly_reports
CREATE INDEX IF NOT EXISTS idx_monthly_reports_professional_id ON monthly_reports(professional_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_period ON monthly_reports(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_payment_status ON monthly_reports(payment_status);
