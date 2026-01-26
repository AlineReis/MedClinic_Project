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
    async createAppointment(data) {
        // data: { patient_id, professional_id, date (YYYY-MM-DD), time (HH:MM), type }

        // 1. Validações Básicas (Data Futura)
        const appointmentDate = new Date(`${data.date}T${data.time}`);
        const now = new Date();

        // RN-02: Minimo 2h antecedência
        const diffHours = (appointmentDate - now) / 36e5;
        if (diffHours < 2) {
            throw new Error('Agendamento deve ser feito com no mínimo 2 horas de antecedência (RN-02).');
        }

        // RN-03: Maximo 90 dias
        const diffDays = (appointmentDate - now) / (1000 * 60 * 60 * 24);
        if (diffDays > 90) {
            throw new Error('Agendamento não pode exceder 90 dias de antecedência (RN-03).');
        }

        // 2. RN-01: Disponibilidade do Médico
        const isAvailable = this._checkAvailability(data.professional_id, appointmentDate);
        if (!isAvailable) {
            throw new Error('Médico não atende neste dia ou horário (RN-01).');
        }

        // 3. RN-04: Conflito de Agendamento (Mesmo dia com mesmo médico)
        const hasConflict = this._checkConcurrency(data.patient_id, data.professional_id, data.date);
        if (hasConflict) {
            throw new Error('Você já possui uma consulta com este médico nesta data (RN-04).');
        }

        // 4. Verificar Sobreposição de Horário (Slot ocupado)
        const isSlotTaken = this._checkSlotTaken(data.professional_id, data.date, data.time);
        if (isSlotTaken) {
            throw new Error('Este horário já está preenchido por outro paciente.');
        }

        // 5. Congelar Preço (Snapshot)
        const professionalUser = DB.users.findById(data.professional_id);
        const frozenPrice = professionalUser?.professional_details?.price || 0;

        // Sucesso: Criar
        // Simular delay
        await new Promise(r => setTimeout(r, 600));

        const newAppt = DB.appointments.create({
            patient_id: data.patient_id,
            professional_id: data.professional_id,
            date: data.date,
            time: data.time,
            duration_minutes: 30, // Padrão
            type: data.type || 'presencial',
            status: this.STATUS.SCHEDULED,
            price: frozenPrice, // Preço Congelado
            notes: ''
        });

        return newAppt;
    },

    getAppointments(userId, role) {
        const all = DB.appointments.findAll();

        if (role === 'paciente') {
            return all.filter(a => String(a.patient_id) === String(userId));
        } else if (role === 'medico') {
            return all.filter(a => String(a.professional_id) === String(userId));
        } else if (['admin', 'recepcionista', 'system_admin'].includes(role)) {
            return all;
        }
        return [];
    },

    cancelAppointment(appointmentId, reason, byRole) {
        const appointments = DB.getAll().appointments;
        const apptIndex = appointments.findIndex(a => String(a.id) === String(appointmentId));

        if (apptIndex === -1) throw new Error('Agendamento não encontrado');

        const newStatus = byRole === 'paciente' ?
            this.STATUS.CANCELLED_BY_PATIENT :
            this.STATUS.CANCELLED_BY_CLINIC;

        // Atualizar status no DB
        appointments[apptIndex].status = newStatus;
        appointments[apptIndex].cancellation_reason = reason;
        appointments[apptIndex].updated_at = new Date().toISOString();

        DB.save({ ...DB.getAll(), appointments });

        return appointments[apptIndex];
    },

    // ==========================================
    // Private Helpers
    // ==========================================

    _checkAvailability(professionalId, dateObj) {
        const paramsDay = dateObj.getDay(); // 0-6
        const paramsTime = dateObj.toTimeString().substr(0, 5); // HH:MM

        const availabilities = DB.availabilities.findByProfessionalId(professionalId);

        // Verificar se tem regra para esse dia da semana
        const rule = availabilities.find(a => a.day_of_week === paramsDay);
        if (!rule) return false;

        // Verificar intervalo de horas
        if (paramsTime >= rule.start_time && paramsTime < rule.end_time) {
            return true;
        }

        return false;
    },

    _checkConcurrency(patientId, professionalId, dateStr) {
        // RN-04: Impedir duplicidade no mesmo dia (exceto cancelados/no_show)
        const apps = DB.appointments.findAll();

        const conflict = apps.find(a =>
            String(a.patient_id) === String(patientId) &&
            String(a.professional_id) === String(professionalId) &&
            a.date === dateStr &&
            ![this.STATUS.CANCELLED_BY_PATIENT, this.STATUS.CANCELLED_BY_CLINIC, this.STATUS.NO_SHOW].includes(a.status)
        );

        return !!conflict;
    },

    _checkSlotTaken(professionalId, dateStr, timeStr) {
        const apps = DB.appointments.findAll();

        const taken = apps.find(a =>
            String(a.professional_id) === String(professionalId) &&
            a.date === dateStr &&
            a.time === timeStr &&
            ![this.STATUS.CANCELLED_BY_PATIENT, this.STATUS.CANCELLED_BY_CLINIC, this.STATUS.NO_SHOW].includes(a.status)
        );

        return !!taken;
    }
};

export default Schedule;
