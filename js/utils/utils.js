/**
 * UTILS.JS
 * MedClinic - Funções Utilitárias e Formatadores
 */

const Utils = {
    // === FORMATADORES DE MOEDA ===

    /**
     * Formata valor para moeda brasileira
     * @param {number} value
     * @returns {string}
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    /**
     * Parse de string de moeda para número
     * @param {string} str
     * @returns {number}
     */
    parseCurrency(str) {
        return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.'));
    },

    // === FORMATADORES DE DATA ===

    /**
     * Formata data para exibição (DD/MM/YYYY)
     * @param {string|Date} date
     * @returns {string}
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    },

    /**
     * Formata data e hora
     * @param {string|Date} date
     * @returns {string}
     */
    formatDateTime(date) {
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
    },

    /**
     * Formata data por extenso
     * @param {string|Date} date
     * @returns {string}
     */
    formatDateLong(date) {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Retorna data relativa (Hoje, Ontem, etc)
     * @param {string|Date} date
     * @returns {string}
     */
    formatDateRelative(date) {
        const d = new Date(date);
        const today = new Date();
        const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays === -1) return 'Amanhã';
        if (diffDays < 7 && diffDays > 0) return `${diffDays} dias atrás`;
        if (diffDays > -7 && diffDays < 0) return `Em ${Math.abs(diffDays)} dias`;

        return this.formatDate(date);
    },

    // === FORMATADORES DE DOCUMENTOS ===

    /**
     * Formata CPF (000.000.000-00)
     * @param {string} cpf
     * @returns {string}
     */
    formatCPF(cpf) {
        const cleaned = cpf.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    /**
     * Formata telefone ((00) 00000-0000)
     * @param {string} phone
     * @returns {string}
     */
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    },

    // === HELPERS DE STRING ===

    /**
     * Retorna iniciais do nome
     * @param {string} name
     * @returns {string}
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    },

    /**
     * Trunca texto com reticências
     * @param {string} text
     * @param {number} maxLength
     * @returns {string}
     */
    truncate(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    /**
     * Capitaliza primeira letra de cada palavra
     * @param {string} text
     * @returns {string}
     */
    capitalize(text) {
        return text.replace(/\b\w/g, l => l.toUpperCase());
    },

    // === HELPERS DE STATUS ===

    /**
     * Retorna label e cor para status de consulta
     * @param {string} status
     * @returns {{label: string, color: string}}
     */
    getAppointmentStatusInfo(status) {
        const statusMap = {
            'scheduled': { label: 'Agendada', color: 'blue' },
            'confirmed': { label: 'Confirmada', color: 'emerald' },
            'waiting': { label: 'Em Espera', color: 'amber' },
            'in_progress': { label: 'Em Atendimento', color: 'purple' },
            'completed': { label: 'Realizada', color: 'emerald' },
            'no_show': { label: 'Faltou', color: 'red' },
            'cancelled_by_patient': { label: 'Cancelada', color: 'slate' },
            'cancelled_by_clinic': { label: 'Cancelada', color: 'slate' },
            'rescheduled': { label: 'Remarcada', color: 'orange' }
        };
        return statusMap[status] || { label: status, color: 'slate' };
    },

    /**
     * Retorna label e cor para status de pagamento
     * @param {string} status
     * @returns {{label: string, color: string}}
     */
    getPaymentStatusInfo(status) {
        const statusMap = {
            'pending': { label: 'Pendente', color: 'amber' },
            'processing': { label: 'Processando', color: 'blue' },
            'paid': { label: 'Pago', color: 'emerald' },
            'failed': { label: 'Falhou', color: 'red' },
            'refunded': { label: 'Reembolsado', color: 'purple' },
            'partially_refunded': { label: 'Reembolso Parcial', color: 'orange' }
        };
        return statusMap[status] || { label: status, color: 'slate' };
    },

    /**
     * Retorna label e cor para status de exame
     * @param {string} status
     * @returns {{label: string, color: string}}
     */
    getExamStatusInfo(status) {
        const statusMap = {
            'pending_payment': { label: 'Aguardando Pagamento', color: 'amber' },
            'paid_pending_schedule': { label: 'Pago - Agendar', color: 'blue' },
            'scheduled': { label: 'Agendado', color: 'blue' },
            'in_analysis': { label: 'Em Análise', color: 'purple' },
            'ready': { label: 'Pronto', color: 'emerald' },
            'released': { label: 'Liberado', color: 'emerald' },
            'cancelled': { label: 'Cancelado', color: 'slate' }
        };
        return statusMap[status] || { label: status, color: 'slate' };
    },

    // === CÁLCULOS DE NEGÓCIO ===

    /**
     * Calcula split de receita (RN-18)
     * @param {number} grossAmount
     * @param {number} mdrRate - Taxa MDR (padrão 3.79%)
     * @returns {object}
     */
    calculateSplit(grossAmount, mdrRate = 0.0379) {
        const mdrFee = grossAmount * mdrRate;
        const netAmount = grossAmount - mdrFee;

        return {
            gross: grossAmount,
            mdrFee: Math.round(mdrFee * 100) / 100,
            net: Math.round(netAmount * 100) / 100,
            professional: Math.round(netAmount * 0.60 * 100) / 100, // 60%
            clinic: Math.round(netAmount * 0.35 * 100) / 100,       // 35%
            system: Math.round(netAmount * 0.05 * 100) / 100        // 5%
        };
    },

    /**
     * Calcula reembolso baseado em tempo (RN-21/22)
     * @param {number} amount
     * @param {Date} appointmentDate
     * @param {Date} cancellationDate
     * @returns {object}
     */
    calculateRefund(amount, appointmentDate, cancellationDate = new Date()) {
        const hoursUntil = (new Date(appointmentDate) - cancellationDate) / (1000 * 60 * 60);

        if (hoursUntil >= 24) {
            // RN-21: Reembolso total (>24h)
            return {
                percentage: 100,
                refundAmount: amount,
                retainedAmount: 0,
                reason: 'Cancelamento com mais de 24h de antecedência'
            };
        } else {
            // RN-22: Reembolso parcial (<24h)
            const refundAmount = Math.round(amount * 0.70 * 100) / 100;
            return {
                percentage: 70,
                refundAmount,
                retainedAmount: Math.round((amount - refundAmount) * 100) / 100,
                reason: 'Cancelamento com menos de 24h de antecedência (multa 30%)'
            };
        }
    },

    // === HELPERS DOM ===

    /**
     * Mostra toast de notificação
     * @param {string} message
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     */
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-emerald-600',
            error: 'bg-red-600',
            warning: 'bg-amber-600',
            info: 'bg-blue-600'
        };

        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-up`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Debounce para inputs
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}
