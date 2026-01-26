
import * as Validators from '../utils/validators';

/**
 * Form Handling Component
 * Manages form validation and submission.
 */
export default class Form {
    static validateField(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
        const value = input.value.trim();
        const type = input.dataset.validate; // e.g., 'email', 'cpf', 'required'
        const customMessage = input.dataset.errorMessage;

        let isValid = true;
        let errorMessage = '';

        // Reset state
        this.clearError(input);

        // Required check
        if (input.required && !value) {
            isValid = false;
            errorMessage = 'Campo obrigatório';
        }
        // Type specific validation
        else if (type && value) {
            switch (type) {
                case 'email':
                    isValid = Validators.isValidEmail(value);
                    errorMessage = 'Email inválido';
                    break;
                case 'cpf':
                    isValid = Validators.isValidCPF(value);
                    errorMessage = 'CPF inválido';
                    break;
                case 'phone':
                    isValid = Validators.isValidPhone(value);
                    errorMessage = 'Telefone inválido';
                    break;
                case 'password':
                    isValid = Validators.isValidPassword(value);
                    errorMessage = 'Senha deve ter min. 6 caracteres';
                    break;
            }
        }

        if (!isValid) {
            this.showError(input, customMessage || errorMessage);
        }

        return isValid;
    }

    static validateForm(formId: string): boolean {
        const form = document.getElementById(formId) as HTMLFormElement;
        if (!form) {
            console.error(`Form with ID '${formId}' not found.`);
            return false;
        }

        const inputs = form.querySelectorAll('input, select, textarea');
        let isFormValid = true;

        inputs.forEach((input) => {
            if (!this.validateField(input as HTMLInputElement)) {
                isFormValid = false;
            }
        });

        // Focus first error
        if (!isFormValid) {
            const firstError = form.querySelector('.error') as HTMLElement;
            if (firstError) firstError.focus();
        }

        return isFormValid;
    }

    static showError(input: Element, message: string) {
        input.classList.add('error');

        // Find or create error message element
        let errorEl = input.parentElement?.querySelector('.input-error-message');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'input-error-message';
            input.parentElement?.appendChild(errorEl);
        }

        errorEl.textContent = message;
    }

    static clearError(input: Element) {
        input.classList.remove('error');
        const errorEl = input.parentElement?.querySelector('.input-error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    static reset(formId: string) {
        const form = document.getElementById(formId) as HTMLFormElement;
        if (form) {
            form.reset();
            form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            form.querySelectorAll('.input-error-message').forEach(el => el.remove());
        }
    }
}
