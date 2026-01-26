/**
 * Type Definitions for MedClinic Frontend
 * Definições de tipos TypeScript para todas as entidades do sistema
 */

// ==========================================
// User Types
// ==========================================

export type UserRole = 'admin' | 'medico' | 'paciente' | 'recepcionista';

export interface User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    cpf: string;
    phone?: string;
    avatar?: string;
    created_at: string;
}

// ==========================================
// Appointment Types
// ==========================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentType = 'consulta' | 'retorno' | 'exame';

export interface Appointment {
    id: number;
    patientId: number;
    patientName?: string;
    doctorId: number;
    doctorName?: string;
    specialty?: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    type: AppointmentType;
    notes?: string;
    created_at: string;
}

// ==========================================
// Availability Types
// ==========================================

export interface Availability {
    id: number;
    professional_id: number;
    day_of_week: number; // 0-6 (Sunday-Saturday)
    start_time: string;
    end_time: string;
    is_active: boolean;
}

// ==========================================
// Database Types
// ==========================================

export interface Database {
    users: User[];
    appointments: Appointment[];
    availabilities: Availability[];
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// ==========================================
// Form Types
// ==========================================

export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone?: string;
    role: UserRole;
}

export interface AppointmentFormData {
    patientId: number;
    doctorId: number;
    date: string;
    time: string;
    type: AppointmentType;
    notes?: string;
}
