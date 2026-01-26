export interface User {
    id: number;
    name: string;
    email: string;
    role: 'patient' | 'receptionist' | 'lab_tech' | 'health_professional' | 'clinic_admin' | 'system_admin' | 'medico' | 'admin'; // Legacy roles included
    avatar?: string;
    cpf?: string;
    phone?: string;
    professional_details?: {
        specialty: string;
        crm: string;
        price: number;
    };
}

export interface Appointment {
    id: number;
    patientId: number;
    patientName?: string;
    doctorId: number;
    doctorName?: string;
    specialty?: string;
    date: string;
    time: string;
    type: 'presencial' | 'online';
    status: 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'no_show' | 'cancelled_by_patient' | 'cancelled_by_clinic' | 'rescheduled' | 'agendada'; // 'agendada' legacy
    price: number;
    payment_status?: string;
}

export interface AuthResponse {
    success: boolean;
    user: User;
    message?: string;
    token?: string;
    error?: string;
}
