
/**
 * Toast Notification Component
 * Displays temporary messages to the user.
 */
export default class Toast {
    static container: HTMLElement | null = null;

    static init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            console.error('Toast container not found in DOM.');
        }
    }

    static show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 5000) {
        if (!this.container) this.init();
        if (!this.container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons: Record<string, string> = {
            success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4m0-4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.isConnected) {
                toast.classList.add('exiting');
                toast.addEventListener('animationend', () => toast.remove());
            }
        }, duration);
    }

    static success(message: string, title = 'Sucesso') {
        this.show('success', title, message);
    }

    static error(message: string, title = 'Erro') {
        this.show('error', title, message);
    }

    static warning(message: string, title = 'Atenção') {
        this.show('warning', title, message);
    }

    static info(message: string, title = 'Informação') {
        this.show('info', title, message);
    }
}
