import Modal from './Modal';
import DB from '../services/db';
import type { User } from '../types';

const DoctorProfileModal = {
    currentDoctorId: null as number | null,

    open(doctorId: number) {
        this.currentDoctorId = doctorId;
        const doctor = DB.users.findById(doctorId);
        if (!doctor) return;

        Modal.show(
            `Editar Perfil - ${doctor.name}`,
            this.getTemplate(doctor),
            () => this.handleSave()
        );
    },

    getTemplate(doctor: any) { // Type 'any' for DB flexibility
        const details = doctor.professional_details || {};
        const specialty = details.specialty || '';
        const crm = details.crm || '';
        const price = details.price || '';

        return `
        <div class="form-group">
            <label class="form-label">Nome Completo (Apenas visualização)</label>
            <input type="text" class="form-input" value="${doctor.name}" disabled style="background-color: var(--color-gray-50);">
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <label class="form-label">Especialidade</label>
                <input type="text" class="form-input" id="docSpecialty" value="${specialty}" placeholder="Ex: Cardiologia">
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="form-label">CRM</label>
                <input type="text" class="form-input" id="docCRM" value="${crm}" placeholder="Ex: 12345-SP">
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Valor da Consulta (R$)</label>
            <input type="number" class="form-input" id="docPrice" value="${price}" step="0.01" placeholder="0.00">
        </div>
        `;
    },

    handleSave() {
        if (!this.currentDoctorId) return true;

        const specialty = (document.getElementById('docSpecialty') as HTMLInputElement).value;
        const crm = (document.getElementById('docCRM') as HTMLInputElement).value;
        const price = parseFloat((document.getElementById('docPrice') as HTMLInputElement).value) || 0;

        const updates = {
            professional_details: {
                specialty,
                crm,
                price
            }
        };

        DB.users.update(this.currentDoctorId, updates);

        // Refresh list if DoctorManager is available globally (it is)
        if ((window as any).DoctorManager) {
            (window as any).DoctorManager.renderList();
        }

        return true;
    }
};

export default DoctorProfileModal;
