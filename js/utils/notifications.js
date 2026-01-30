/**
 * NOTIFICATIONS.JS
 * MedClinic - Browser Notifications
 */

const Notifications = {
    /**
     * Check if notifications are supported
     */
    isSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator;
    },

    /**
     * Get current permission status
     */
    getPermission() {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    },

    /**
     * Request notification permission
     * @returns {Promise<string>}
     */
    async requestPermission() {
        if (!this.isSupported()) {
            console.warn('[Notifications] Not supported in this browser');
            return 'unsupported';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        try {
            const result = await Notification.requestPermission();
            console.log('[Notifications] Permission:', result);
            return result;
        } catch (error) {
            console.error('[Notifications] Permission request failed:', error);
            return 'denied';
        }
    },

    /**
     * Show a local notification
     * @param {string} title
     * @param {object} options
     */
    async show(title, options = {}) {
        if (!this.isSupported()) return null;

        const permission = await this.requestPermission();
        if (permission !== 'granted') return null;

        const defaultOptions = {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            vibrate: [100, 50, 100],
            requireInteraction: false,
            silent: false
        };

        const notification = new Notification(title, { ...defaultOptions, ...options });

        notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.url) {
                window.location.href = options.url;
            }
        };

        return notification;
    },

    /**
     * Schedule a reminder notification
     * @param {string} title
     * @param {object} options
     * @param {number} delayMs
     */
    schedule(title, options, delayMs) {
        setTimeout(() => {
            this.show(title, options);
        }, delayMs);
    },

    // === PRESET NOTIFICATIONS ===

    /**
     * Appointment reminder
     * @param {object} appointment
     */
    appointmentReminder(appointment) {
        this.show('Lembrete de Consulta', {
            body: `Sua consulta com ${appointment.professional_name} é amanhã às ${appointment.time}`,
            tag: `appointment-${appointment.id}`,
            url: '/my-appointments.html'
        });
    },

    /**
     * Exam result ready
     * @param {object} exam
     */
    examReady(exam) {
        this.show('Resultado de Exame Disponível', {
            body: `O resultado do seu ${exam.exam_name} está pronto`,
            tag: `exam-${exam.id}`,
            url: '/exams.html',
            requireInteraction: true
        });
    },

    /**
     * New patient arrived (for receptionist)
     * @param {object} patient
     */
    patientArrived(patient) {
        this.show('Paciente Chegou', {
            body: `${patient.name} fez check-in para consulta`,
            tag: `checkin-${patient.id}`,
            url: '/reception-dashboard.html'
        });
    },

    /**
     * Next patient ready (for doctor)
     * @param {object} patient
     */
    nextPatient(patient) {
        this.show('Próximo Paciente', {
            body: `${patient.name} está aguardando na sala`,
            tag: `next-${patient.id}`,
            url: '/doctor-dashboard.html'
        });
    },

    /**
     * Payment received (for manager)
     * @param {object} transaction
     */
    paymentReceived(transaction) {
        this.show('Pagamento Recebido', {
            body: `R$ ${transaction.gross_amount.toFixed(2)} - ${transaction.patient_name}`,
            tag: `payment-${transaction.id}`,
            url: '/financial.html'
        });
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Notifications;
} else {
    window.Notifications = Notifications;
}
