export interface Appointment {
    id?: number;
    patient_id: number;
    professional_id: number;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    duration_minutes?: number;
    type: 'presencial' | 'online';
    status?: 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'no_show' | 'cancelled_by_patient' | 'cancelled_by_clinic' | 'rescheduled';
    price: number;
    payment_status?: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    video_link?: string;
    room_number?: string;
    notes?: string;
    cancellation_reason?: string;
    cancelled_by?: number;
    created_at?: string;
    updated_at?: string;
}

export interface AppointmentFilters {
    status?: string;
    professional_id?: number;
    patient_id?: number;
    date?: string;     // Data exata
    startDate?: string; // Intervalo inicio (opcional, bom ter)
    endDate?: string;   // Intervalo fim (opcional, bom ter)
    upcoming?: boolean; // Se true, filtra date >= hoje
}

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PaginatedResult<T> {
    total: number;
    data: T[];
    page: number;
    pageSize: number;
    totalPages: number;
}
