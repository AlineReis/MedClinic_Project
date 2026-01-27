import Modal from './Modal';
import Toast from './Toast';
import Form from './Form';
import DB from '../services/db';
import Auth from '../services/auth';
import Schedule from '../services/schedule';
import type { User, Appointment } from '../types';

const AppointmentModal = {
    init() {
        // Event listeners serão configurados quando o modal abrir
    },

    open() {
        Modal.show(
            'Nova Consulta',
            this.getFormHtml(),
            () => this.handleSubmit()
        );

        // Pós-render: popular selects e configurar eventos
        this.populateSelects();
        this.setupFormEvents();
    },

    getFormHtml() {
        return `
            <form id="appointmentForm" class="modal-form">
                <div class="form-group">
                    <label for="apptPatient">Paciente</label>
                    <select id="apptPatient" class="form-input" required>
                        <option value="">Selecione um paciente...</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="apptDoctor">Médico</label>
                    <select id="apptDoctor" class="form-input" required>
                        <option value="">Selecione um médico...</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="apptDate">Data</label>
                        <input type="date" id="apptDate" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="apptTime">Horário</label>
                        <select id="apptTime" class="form-input" required disabled>
                            <option value="">Selecione a data primeiro</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="apptType">Tipo de Consulta</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="apptType" value="consulta" checked>
                            <span>Consulta</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="apptType" value="retorno">
                            <span>Retorno</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="apptType" value="exame">
                            <span>Exame</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label for="apptNotes">Observações</label>
                    <textarea id="apptNotes" class="form-input" rows="3" placeholder="Sintomas, histórico, etc."></textarea>
                </div>
                
                <div id="slotError" class="form-error" style="display:none; color: red; margin-top: 10px;"></div>
            </form>
        `;
    },

    populateSelects() {
        const patientSelect = document.getElementById('apptPatient') as HTMLSelectElement;
        const doctorSelect = document.getElementById('apptDoctor') as HTMLSelectElement;
        const currentUser = Auth.getCurrentUser();

        // Populate Patients
        // If user is patient, only show themselves
        let patients: User[] = [];
        if (currentUser && currentUser.role === 'paciente') {
            patients = [currentUser];
            patientSelect.disabled = true; // Lock selection
            // Note: need to make sure we select it after appending
        } else {
            // Admin/Receptionist sees everyone
            patients = DB.users.findAll().filter((u: User) => u.role === 'paciente' || u.role === 'recepcionista' || u.role === 'admin');
            patientSelect.disabled = false;
        }

        patients.forEach((p: User) => {
            const option = document.createElement('option');
            option.value = p.id.toString();
            option.textContent = `${p.name} (CPF: ${p.cpf})`;
            patientSelect.appendChild(option);
        });

        // Auto-select if single option (patient mode)
        if (patients.length === 1 && currentUser?.role === 'paciente') {
            patientSelect.value = currentUser.id.toString();
        }

        // Populate Doctors
        const doctors = DB.users.findAll().filter((u: User) => u.role === 'medico');
        doctors.forEach((d: User) => {
            const option = document.createElement('option');
            option.value = d.id.toString();
            option.textContent = d.name;
            doctorSelect.appendChild(option);
        });
    },

    setupFormEvents() {
        const dateInput = document.getElementById('apptDate') as HTMLInputElement;
        const doctorSelect = document.getElementById('apptDoctor') as HTMLSelectElement;
        const timeSelect = document.getElementById('apptTime') as HTMLSelectElement;

        const updateSlots = () => {
            const doctorId = doctorSelect.value;
            const date = dateInput.value;

            if (doctorId && date) {
                timeSelect.disabled = false;
                timeSelect.innerHTML = '<option value="">Carregando...</option>';

                // Simular busca de slots disponíveis
                setTimeout(() => {
                    // TODO: Implementar getAvailableSlots no Schedule service real
                    // Por enquanto mockando
                    const slots = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];
                    // const slots = Schedule.getAvailableSlots(parseInt(doctorId), date);

                    timeSelect.innerHTML = '<option value="">Selecione um horário</option>';

                    if (slots.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'Sem horários disponíveis';
                        option.disabled = true;
                        timeSelect.appendChild(option);
                    } else {
                        slots.forEach((slot: string) => {
                            const option = document.createElement('option');
                            option.value = slot;
                            option.textContent = slot;
                            timeSelect.appendChild(option);
                        });
                    }
                }, 300);
            } else {
                timeSelect.disabled = true;
                timeSelect.innerHTML = '<option value="">Selecione médico e data</option>';
            }
        };

        dateInput.min = new Date().toISOString().split('T')[0];
        dateInput.addEventListener('change', updateSlots);
        doctorSelect.addEventListener('change', updateSlots);
    },

    async handleSubmit() {
        const form = document.getElementById('appointmentForm') as HTMLFormElement;
        if (!form.checkValidity()) {
            form.reportValidity();
            return false; // Prevent modal close
        }

        const patientId = (document.getElementById('apptPatient') as HTMLSelectElement).value;
        const doctorId = (document.getElementById('apptDoctor') as HTMLSelectElement).value;
        const date = (document.getElementById('apptDate') as HTMLInputElement).value;
        const time = (document.getElementById('apptTime') as HTMLSelectElement).value;

        let type = 'consulta';
        const typeInputs = document.getElementsByName('apptType') as NodeListOf<HTMLInputElement>;
        typeInputs.forEach(input => {
            if (input.checked) type = input.value;
        });

        const notes = (document.getElementById('apptNotes') as HTMLTextAreaElement).value;

        try {
            await Schedule.createAppointment({
                patientId: parseInt(patientId),
                doctorId: parseInt(doctorId),
                date,
                time,
                type: type as any,
                notes
            });

            Toast.success('Consulta agendada com sucesso!');

            // Recarregar lista se estiver na página de agendamentos
            // (Isso será tratado pelo main.ts ouvindo eventos ou chamada direta, 
            //  por enquanto vamos forçar um reload simples na UI)

            // TODO: Emitir evento global ou chamar método de atualização

            return true; // Close modal
        } catch (error: any) {
            const errorDiv = document.getElementById('slotError');
            if (errorDiv) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            }
            return false;
        }
    }
};

export default AppointmentModal;
