/**
 * Utility Functions & Validators
 * Funções de uso geral para validação e formatação segura.
 */

// ==========================================
// Validators
// ==========================================

export const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    // Elimina CPFs invalidos conhecidos
    if (cpf.length != 11 ||
        cpf == "00000000000" ||
        cpf == "11111111111" ||
        cpf == "22222222222" ||
        cpf == "33333333333" ||
        cpf == "44444444444" ||
        cpf == "55555555555" ||
        cpf == "66666666666" ||
        cpf == "77777777777" ||
        cpf == "88888888888" ||
        cpf == "99999999999")
        return false;

    let add = 0;
    for (let i = 0; i < 9; i++)
        add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11)
        rev = 0;
    if (rev != parseInt(cpf.charAt(9)))
        return false;

    add = 0;
    for (let i = 0; i < 10; i++)
        add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11)
        rev = 0;
    if (rev != parseInt(cpf.charAt(10)))
        return false;
    return true;
};

export const isValidPassword = (password: string): boolean => {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return regex.test(password);
};

export const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
    const regex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    return regex.test(phone) || /^\d{10,11}$/.test(phone);
};

// Legacy object for default import compatibility
const Utils = {
    validators: {
        isValidCPF,
        isStrongPassword: isValidPassword,
        isValidEmail
    },

    // ==========================================
    // Formatters & Security
    // ==========================================

    security: {
        // RN-17: Máscara de Cartão (apenas ultimos 4 digitos)
        maskCardNumber(cardNumber: string) {
            const clean = cardNumber.replace(/\D/g, '');
            if (clean.length < 4) return '****';
            return `**** **** **** ${clean.slice(-4)}`;
        },

        // Simulação de Hash (em prod seria bcrypt no server)
        hashPassword(password: string) {
            return `hash_${password}`; // Mock simples para não armazenar plain text visualmente
        }
    },

    format: {
        currency(value: number) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        },

        date(dateString: string) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        },

        dateTime(dateString: string) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR');
        }
    },

    // Tratamento de UI
    ui: {
        showError(inputElement: HTMLElement, message: string) {
            const parent = inputElement.parentElement;
            if (!parent) return;
            let errorDiv = parent.querySelector('.error-message') as HTMLElement;
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.color = 'var(--color-danger)';
                errorDiv.style.fontSize = '0.875rem';
                errorDiv.style.marginTop = '0.25rem';
                parent.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
            inputElement.style.borderColor = 'var(--color-danger)';
        },

        clearError(inputElement: HTMLElement) {
            const parent = inputElement.parentElement;
            if (!parent) return;
            const errorDiv = parent.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.remove();
            }
            inputElement.style.borderColor = '';
        }
    }
};

export default Utils;
