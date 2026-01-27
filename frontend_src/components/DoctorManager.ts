import DB from '../services/db';
import Auth from '../services/auth';
import type { User } from '../types';
import AvailabilityModal from './AvailabilityModal';
import DoctorProfileModal from './DoctorProfileModal';

const DoctorManager = {
    renderList() {
        const container = document.getElementById('doctorsPage');
        if (!container) return;

        const grid = container.querySelector('.doctors-grid');
        if (!grid) return;

        const doctors = DB.users.findAll().filter((u: User) => u.role === 'medico');

        if (doctors.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>Nenhum médico cadastrado.</p></div>';
            return;
        }

        grid.innerHTML = doctors.map((doctor: User) => this.createDoctorCard(doctor)).join('');
    },

    createDoctorCard(doctor: User) {
        const initials = doctor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        const specialty = doctor.professional_details?.specialty || 'Clínica Geral';
        const crm = doctor.professional_details?.crm || 'CRM Pendente';

        return `
        <div class="patient-card doctor-card">
            <div class="patient-header">
                <div class="patient-avatar" style="background-color: var(--color-primary-light); color: var(--color-primary-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; font-weight: bold; font-size: 1.2rem;">${initials}</div>
                <div class="patient-info">
                    <h3 class="patient-name">${doctor.name}</h3>
                    <p class="patient-cpf">${crm}</p>
                </div>
            </div>
            <div class="patient-details">
                <div class="detail-item">
                    <span class="detail-label">Especialidade</span>
                    <span class="detail-value">${specialty}</span>
                </div>
                 <div class="detail-item">
                    <span class="detail-label">Disponibilidade</span>
                    <span class="detail-value">Seg - Sex</span>
                </div>
            </div>
            <div class="patient-actions">
                ${this.canEditProfile() ? `<button class="btn-secondary-small" onclick="DoctorManager.openProfileModal('${doctor.id}')">Editar Perfil</button>` : ''}
                <button class="btn-secondary-small" onclick="DoctorManager.openAvailabilityModal('${doctor.id}')">Configurar Horários</button>
            </div>
        </div>
        `;
    },

    canEditProfile() {
        const user = Auth.getCurrentUser();
        return user && user.role === 'system_admin';
    },

    openAvailabilityModal(doctorId: string) {
        AvailabilityModal.open(parseInt(doctorId));
    },

    openProfileModal(doctorId: string) {
        DoctorProfileModal.open(parseInt(doctorId));
    }
};

// Expose globally for onclick handlers
(window as any).DoctorManager = DoctorManager;

export default DoctorManager;
