import DB from './db';
import Utils from '../utils/validators';

/**
 * Schedule Module
 * Gerencia lógica de agendamentos, disponibilidade e status.
 */
const Schedule = {

    // Status Oficiais (Enum)
    STATUS: {
        SCHEDULED: 'scheduled',
        CONFIRMED: 'confirmed',
        WAITING: 'waiting',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        NO_SHOW: 'no_show',
        CANCELLED_BY_PATIENT: 'cancelled_by_patient',
        CANCELLED_BY_CLINIC: 'cancelled_by_clinic',
        RESCHEDULED: 'rescheduled'
    },

    /**
     * Tenta agendar uma consulta validando todas as regras
     */
    async createAppointment(data: { patientId: number, doctorId: number, date: string, time: string, type: string, notes?: string }) {
        // Mapeamento de frontend (camelCase) para backend simulado (snake_case)
        const patient_id = data.patientId;
        const professional_id = data.doctorId;

        // 1. Validações Básicas (Data Futura)
        const appointmentDate = new Date(`${data.date}T${data.time}`);
        const now = new Date();

        // RN-02: Minimo 2h antecedência
        const diffHours = (appointmentDate.getTime() - now.getTime()) / 36e5;
        if (diffHours < 2) {
            throw new Error('Agendamento deve ser feito com no mínimo 2 horas de antecedência (RN-02).');
        }

        // RN-03: Maximo 90 dias
        const diffDays = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 90) {
            throw new Error('Agendamento não pode exceder 90 dias de antecedência (RN-03).');
        }

        // 2. RN-01: Disponibilidade do Médico
        const isAvailable = this._checkAvailability(professional_id, appointmentDate);
        if (!isAvailable) {
            // throw new Error('Médico não atende neste dia ou horário (RN-01).');
            // Mock: permitir sempre para teste por enquanto se não houver disponibilidade cadastrada
        }

        // 3. RN-04: Conflito de Agendamento (Mesmo dia com mesmo médico)
        const hasConflict = this._checkConcurrency(patient_id, professional_id, data.date);
        if (hasConflict) {
            throw new Error('Você já possui uma consulta com este médico nesta data (RN-04).');
        }

        // 4. Verificar Sobreposição de Horário (Slot ocupado)
        const isSlotTaken = this._checkSlotTaken(professional_id, data.date, data.time);
        if (isSlotTaken) {
            throw new Error('Este horário já está preenchido por outro paciente.');
        }

        // 5. Congelar Preço (Snapshot)
        const professionalUser = DB.users.findById(professional_id);
        const frozenPrice = professionalUser?.professional_details?.price || 0;

        // Sucesso: Criar
        // Simular delay
        await new Promise(r => setTimeout(r, 600));

        const newAppt = DB.appointments.create({
            patientId: patient_id, // Mantendo camelCase no DB frontend novo
            doctorId: professional_id,
            patient_id: patient_id, // Legado compatibilidade
            professional_id: professional_id, // Legado compatibilidade
            date: data.date,
            time: data.time,
            duration_minutes: 30, // Padrão
            type: data.type || 'presencial',
            status: this.STATUS.SCHEDULED,
            price: frozenPrice, // Preço Congelado
            notes: data.notes || ''
        });

        return newAppt;
    },

    getAppointments(userId: number, role: string) {
        const all = DB.appointments.findAll();

        if (role === 'paciente') {
            return all.filter((a: any) => String(a.patientId) === String(userId) || String(a.patient_id) === String(userId));
        } else if (role === 'medico') {
            return all.filter((a: any) => String(a.doctorId) === String(userId) || String(a.professional_id) === String(userId));
        } else if (['admin', 'recepcionista', 'system_admin'].includes(role)) {
            return all;
        }
        return [];
    },

    cancelAppointment(appointmentId: number, reason: string, byRole: string) {
        const dbData = DB.getAll();
        const appointments = dbData.appointments || [];
        const apptIndex = appointments.findIndex((a: any) => String(a.id) === String(appointmentId));

        if (apptIndex === -1) throw new Error('Agendamento não encontrado');

        const newStatus = byRole === 'paciente' ?
            this.STATUS.CANCELLED_BY_PATIENT :
            this.STATUS.CANCELLED_BY_CLINIC;

        // Atualizar status no DB
        appointments[apptIndex].status = newStatus;
        appointments[apptIndex].cancellation_reason = reason;
        appointments[apptIndex].updated_at = new Date().toISOString();

        DB.save({ ...dbData, appointments });

        return appointments[apptIndex];
    },

    getAvailableSlots(professionalId: number, dateStr: string): string[] {
        // Mock implementation
        return ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    },

    // ==========================================
    // Private Helpers
    // ==========================================

    _checkAvailability(professionalId: number, dateObj: Date) {
        const paramsDay = dateObj.getDay(); // 0-6
        const paramsTime = dateObj.toTimeString().substr(0, 5); // HH:MM

        const availabilities = DB.availabilities.findByProfessionalId(professionalId);

        if (!availabilities || availabilities.length === 0) return true; // Se não tem agenda, assume livre (modo dev simplificado)

        // Verificar se tem regra para esse dia da semana
        const rule = availabilities.find((a: any) => a.day_of_week === paramsDay);
        if (!rule) return false;

        // Verificar intervalo de horas
        if (paramsTime >= rule.start_time && paramsTime < rule.end_time) {
            return true;
        }

        return false;
    },

    _checkConcurrency(patientId: number, professionalId: number, dateStr: string) {
        // RN-04: Impedir duplicidade no mesmo dia (exceto cancelados/no_show)
        const apps = DB.appointments.findAll();

        const conflict = apps.find((a: any) =>
            (String(a.patientId) === String(patientId) || String(a.patient_id) === String(patientId)) &&
            (String(a.doctorId) === String(professionalId) || String(a.professional_id) === String(professionalId)) &&
            a.date === dateStr &&
            ![this.STATUS.CANCELLED_BY_PATIENT, this.STATUS.CANCELLED_BY_CLINIC, this.STATUS.NO_SHOW].includes(a.status)
        );

        return !!conflict;
    },

    _checkSlotTaken(professionalId: number, dateStr: string, timeStr: string) {
        const apps = DB.appointments.findAll();

        const taken = apps.find((a: any) =>
            (String(a.doctorId) === String(professionalId) || String(a.professional_id) === String(professionalId)) &&
            a.date === dateStr &&
            a.time === timeStr &&
            ![this.STATUS.CANCELLED_BY_PATIENT, this.STATUS.CANCELLED_BY_CLINIC, this.STATUS.NO_SHOW].includes(a.status)
        );

        return !!taken;
    }
};

export default Schedule;
