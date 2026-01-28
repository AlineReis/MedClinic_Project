/**
 * VALIDATION.JS
 * MedClinic - Validações de Formulário
 * Implementa RN-11 (Validações Obrigatórias)
 */

const Validation = {
    /**
     * Valida formato de email
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Valida senha conforme RN-11
     * Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
     * @param {string} password
     * @returns {{valid: boolean, message: string}}
     */
    isValidPassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Senha deve ter pelo menos 1 letra maiúscula' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Senha deve ter pelo menos 1 letra minúscula' };
        }
        if (!/\d/.test(password)) {
            return { valid: false, message: 'Senha deve ter pelo menos 1 número' };
        }
        return { valid: true, message: '' };
    },

    /**
     * Valida CPF com dígitos verificadores
     * @param {string} cpf
     * @returns {boolean}
     */
    isValidCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');

        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false; // Todos dígitos iguais

        // Validação do primeiro dígito
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit1 = (sum * 10) % 11;
        if (digit1 === 10) digit1 = 0;
        if (digit1 !== parseInt(cpf.charAt(9))) return false;

        // Validação do segundo dígito
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        let digit2 = (sum * 10) % 11;
        if (digit2 === 10) digit2 = 0;
        if (digit2 !== parseInt(cpf.charAt(10))) return false;

        return true;
    },

    /**
     * Valida telefone brasileiro
     * Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
     * @param {string} phone
     * @returns {boolean}
     */
    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        // DDD (11-99) + 8 ou 9 dígitos
        if (cleaned.length < 10 || cleaned.length > 11) return false;
        const ddd = parseInt(cleaned.substring(0, 2));
        return ddd >= 11 && ddd <= 99;
    },

    /**
     * Valida data no formato YYYY-MM-DD
     * @param {string} date
     * @param {boolean} mustBeFuture - Se true, data deve ser futura
     * @returns {boolean}
     */
    isValidDate(date, mustBeFuture = false) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(date)) return false;

        const d = new Date(date);
        if (isNaN(d.getTime())) return false;

        if (mustBeFuture) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return d >= today;
        }
        return true;
    },

    /**
     * Valida horário no formato HH:MM
     * @param {string} time
     * @returns {boolean}
     */
    isValidTime(time) {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return regex.test(time);
    },

    /**
     * Valida valor monetário
     * @param {number} value
     * @returns {boolean}
     */
    isValidCurrency(value) {
        if (typeof value !== 'number' || value < 0) return false;
        // Máximo 2 casas decimais
        return Number.isInteger(value * 100);
    },

    /**
     * Valida role do usuário
     * @param {string} role
     * @returns {boolean}
     */
    isValidRole(role) {
        const validRoles = [
            'patient',
            'receptionist',
            'lab_tech',
            'health_professional',
            'clinic_admin',
            'system_admin'
        ];
        return validRoles.includes(role);
    },

    /**
     * Valida dados de agendamento (RN-01 a RN-05)
     * @param {object} data
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateAppointment(data) {
        const errors = [];

        if (!data.professional_id) errors.push('Profissional é obrigatório');
        if (!this.isValidDate(data.date, true)) errors.push('Data inválida ou no passado');
        if (!this.isValidTime(data.time)) errors.push('Horário inválido');
        if (!['presencial', 'online'].includes(data.type)) errors.push('Tipo deve ser presencial ou online');
        if (!data.price || data.price <= 0) errors.push('Preço deve ser maior que zero');

        // RN-02/RN-03: Antecedência
        if (data.date && data.time) {
            const appointmentDate = new Date(`${data.date}T${data.time}`);
            const now = new Date();
            const hoursAhead = (appointmentDate - now) / (1000 * 60 * 60);

            const minHours = data.type === 'online' ? 1 : 2;
            if (hoursAhead < minHours) {
                errors.push(`Antecedência mínima de ${minHours}h para ${data.type}`);
            }

            // RN-03: Máximo 90 dias
            if (hoursAhead > 90 * 24) {
                errors.push('Máximo 90 dias de antecedência');
            }
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Valida dados de exame (RN-09, RN-10)
     * @param {object} data
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateExam(data) {
        const errors = [];

        if (!data.patient_id) errors.push('Paciente é obrigatório');
        if (!data.requesting_professional_id) errors.push('Profissional solicitante é obrigatório');
        if (!data.clinical_indication || data.clinical_indication.trim() === '') {
            errors.push('Indicação clínica é obrigatória');
        }
        if (!['blood', 'image'].includes(data.exam_type)) {
            errors.push('Tipo de exame deve ser blood ou image');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Valida parcelamento conforme RN-16
     * @param {number} amount
     * @param {number} installments
     * @returns {{valid: boolean, maxInstallments: number, message: string}}
     */
    validateInstallments(amount, installments) {
        let maxInstallments;
        let minPerInstallment;

        if (amount <= 120) {
            maxInstallments = 2;
            minPerInstallment = 60;
        } else if (amount <= 250) {
            maxInstallments = 3;
            minPerInstallment = 80;
        } else if (amount <= 500) {
            maxInstallments = 4;
            minPerInstallment = 100;
        } else {
            maxInstallments = 6;
            minPerInstallment = 100;
        }

        // Parcela mínima absoluta: R$ 50
        const absoluteMin = 50;
        const installmentValue = amount / installments;

        if (installments > maxInstallments) {
            return {
                valid: false,
                maxInstallments,
                message: `Máximo ${maxInstallments}x para este valor`
            };
        }

        if (installmentValue < absoluteMin) {
            return {
                valid: false,
                maxInstallments: Math.floor(amount / absoluteMin),
                message: `Parcela mínima de R$ ${absoluteMin}`
            };
        }

        return { valid: true, maxInstallments, message: '' };
    }
};

// Export for module usage or attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
} else {
    window.Validation = Validation;
}
