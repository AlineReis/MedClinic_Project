import Modal from './Modal';
import DB from '../services/db';
import type { Availability } from '../types';

const AvailabilityModal = {
    currentDoctorId: null as number | null,

    open(doctorId: number) {
        this.currentDoctorId = doctorId;
        const doctor = DB.users.findById(doctorId);
        if (!doctor) {
            console.error('Doctor not found');
            return;
        }

        const existingAvailabilities = DB.availabilities.findByProfessionalId(doctorId);

        Modal.show(
            `Configurar Horários - ${doctor.name}`,
            this.getTemplate(existingAvailabilities),
            () => this.handleSave()
        );
    },

    getTemplate(availabilities: any[]) { // Using any[] because DB types are loose, but should be Availability[]
        const days = [
            { id: 1, label: 'Segunda-feira' },
            { id: 2, label: 'Terça-feira' },
            { id: 3, label: 'Quarta-feira' },
            { id: 4, label: 'Quinta-feira' },
            { id: 5, label: 'Sexta-feira' },
            { id: 6, label: 'Sábado' },
            { id: 0, label: 'Domingo' }
        ];

        const rows = days.map(day => {
            const av = availabilities.find(a => a.day_of_week === day.id);
            const isActive = !!av;
            const start = av ? av.start_time : '09:00';
            const end = av ? av.end_time : '18:00';

            return `
            <div class="availability-row" data-day="${day.id}">
                <label class="checkbox-label">
                    <input type="checkbox" class="day-active" ${isActive ? 'checked' : ''}>
                    ${day.label}
                </label>
                <div class="time-inputs ${isActive ? '' : 'disabled'}">
                    <input type="time" class="form-input time-start" value="${start}" ${isActive ? '' : 'disabled'}>
                    <span>até</span>
                    <input type="time" class="form-input time-end" value="${end}" ${isActive ? '' : 'disabled'}>
                </div>
            </div>
            `;
        }).join('');

        return `
            <div class="availability-form">
                <p class="form-description">Defina os dias e horários de atendimento padrão.</p>
                <div class="availability-grid">
                    ${rows}
                </div>
            </div>
            <script>
                // Add simple toggle logic inline for immediacy effectively
                document.querySelectorAll('.availability-row .day-active').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const row = e.target.closest('.availability-row');
                        const inputs = row.querySelectorAll('input[type="time"]');
                        inputs.forEach(input => {
                            input.disabled = !e.target.checked;
                            if (input.disabled) {
                                input.parentElement.classList.add('disabled');
                            } else {
                                input.parentElement.classList.remove('disabled');
                            }
                        });
                    });
                });
            </script>
        `;
    },

    handleSave() {
        if (!this.currentDoctorId) return true;

        const rows = document.querySelectorAll('.availability-row');
        const newAvailabilities: any[] = []; // Partial<Availability>[]

        rows.forEach((row: any) => {
            const dayOfWeek = parseInt(row.getAttribute('data-day'));
            const isActive = row.querySelector('.day-active').checked;

            if (isActive) {
                const startTime = row.querySelector('.time-start').value;
                const endTime = row.querySelector('.time-end').value;

                newAvailabilities.push({
                    day_of_week: dayOfWeek,
                    start_time: startTime,
                    end_time: endTime,
                    is_active: 1
                });
            }
        });

        DB.availabilities.saveForProfessional(this.currentDoctorId, newAvailabilities);

        // We might want to show a toast here, but Modal handles the close
        // Assuming App.Toast is available globally or we import Toast
        // Ideally we should return true to close modal
        return true;
    }
};

export default AvailabilityModal;
