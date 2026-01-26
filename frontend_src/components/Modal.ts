
/**
 * Modal Component
 * Handles opening and closing of modal dialogs.
 */
export default class Modal {
    static init() {
        // Close buttons
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Close button click
            if (target.closest('.modal-close') || target.classList.contains('modal-close')) {
                const modalOverlay = target.closest('.modal-overlay');
                if (modalOverlay) {
                    this.close(modalOverlay.id);
                }
            }

            // Overlay background click
            if (target.classList.contains('modal-overlay')) {
                this.close(target.id);
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.close(activeModal.id);
                }
            }
        });
    }

    static open(modalId: string) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling

            // Focus trap could be implemented here
            const firstInput = modal.querySelector('input') as HTMLElement;
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        } else {
            console.error(`Modal with ID '${modalId}' not found.`);
        }
    }

    static close(modalId: string) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling

            // Optional: Reset forms inside modal on close
            // const form = modal.querySelector('form');
            // if (form) form.reset();
        }
    }
}
