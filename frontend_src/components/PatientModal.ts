import Modal from './Modal';
import Toast from './Toast';
import DB from '../services/db';
import Utils from '../utils/validators';

const PatientModal = {
    init() {
        // Event listeners serão configurados quando o modal abrir
    },

    open() {
        Modal.show(
            'Novo Paciente',
            this.getFormHtml(),
            () => this.handleSubmit()
        );

        // Pós-render: configurar eventos (máscaras, etc)
        this.setupFormEvents();
    },

    getFormHtml() {
        return `
            <form id="patientForm" class="modal-form">
                <div class="form-group">
                    <label for="patientName">Nome Completo</label>
                    <input type="text" id="patientName" class="form-input" required placeholder="Ex: João Silva">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="patientCpf">CPF</label>
                        <input type="text" id="patientCpf" class="form-input" required placeholder="000.000.000-00">
                    </div>
                    <div class="form-group">
                        <label for="patientPhone">Telefone</label>
                        <input type="text" id="patientPhone" class="form-input" required placeholder="(00) 00000-0000">
                    </div>
                </div>

                <div class="form-group">
                    <label for="patientEmail">Email</label>
                    <input type="email" id="patientEmail" class="form-input" required placeholder="joao@email.com">
                </div>

                <div class="form-group">
                    <label for="patientDate">Data de Nascimento</label>
                    <input type="date" id="patientDate" class="form-input">
                </div>
                
                <div class="form-group">
                    <label for="patientPlan">Plano de Saúde</label>
                    <select id="patientPlan" class="form-input">
                        <option value="Particular">Particular</option>
                        <option value="Unimed">Unimed</option>
                        <option value="Bradesco Saúde">Bradesco Saúde</option>
                        <option value="Amil">Amil</option>
                        <option value="SulAmérica">SulAmérica</option>
                    </select>
                </div>

                <div id="patientError" class="form-error" style="display:none; color: red; margin-top: 10px;"></div>
            </form>
        `;
    },

    setupFormEvents() {
        // Adicionar máscaras simples se necessário (implementação futura de input masking)
        const cpfInput = document.getElementById('patientCpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e: any) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                // Máscara 000.000.000-00
                if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
                else if (value.length > 3) value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
                e.target.value = value;
            });
        }

        const phoneInput = document.getElementById('patientPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e: any) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                // Máscara (00) 00000-0000
                if (value.length > 10) value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                else if (value.length > 6) value = value.replace(/(\d{2})(\d{4})/, '($1) $2');
                e.target.value = value;
            });
        }
    },

    handleSubmit(): boolean {
        const nameInput = document.getElementById('patientName') as HTMLInputElement;
        const cpfInput = document.getElementById('patientCpf') as HTMLInputElement;
        const phoneInput = document.getElementById('patientPhone') as HTMLInputElement;
        const emailInput = document.getElementById('patientEmail') as HTMLInputElement;
        const dateInput = document.getElementById('patientDate') as HTMLInputElement;
        const planSelect = document.getElementById('patientPlan') as HTMLSelectElement;
        const errorDiv = document.getElementById('patientError');

        if (!nameInput || !cpfInput || !emailInput || !errorDiv) return false;

        // Reset error
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        // Validation
        if (!nameInput.value.trim()) {
            this.showError('Nome é obrigatório');
            return false;
        }
        if (!cpfInput.value.trim()) {
            this.showError('CPF é obrigatório');
            return false;
        }
        if (!emailInput.value.trim()) {
            this.showError('Email é obrigatório');
            return false;
        }

        const email = emailInput.value.trim();
        const existingUser = DB.users.findByEmail(email);
        if (existingUser) {
            this.showError('Email já cadastrado');
            return false;
        }

        // Create user
        try {
            const newUser = {
                name: nameInput.value.trim(),
                email: email,
                cpf: cpfInput.value.trim(),
                phone: phoneInput ? phoneInput.value.trim() : '',
                role: 'paciente',
                password: '123', // Senha padrão inicial
                patient_details: {
                    birth_date: dateInput ? dateInput.value : '',
                    insurance_plan: planSelect ? planSelect.value : 'Particular'
                }
            };

            const created = DB.users.create(newUser);

            Toast.success('Sucesso', 'Paciente cadastrado com sucesso!');

            // Reload patient list if on patients page
            if (typeof (window as any).App.loadPatients === 'function') {
                (window as any).App.loadPatients('');
            }

            return true; // Return true to close modal

        } catch (error: any) {
            console.error('Error creating patient:', error);
            this.showError('Erro ao criar paciente: ' + error.message);
            return false;
        }
    },

    showError(msg: string) {
        const errorDiv = document.getElementById('patientError');
        if (errorDiv) {
            errorDiv.textContent = msg;
            errorDiv.style.display = 'block';
        }
    }
};

export default PatientModal;
