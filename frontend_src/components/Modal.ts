
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

    static show(title: string, contentHtml: string, onConfirm?: () => Promise<boolean> | boolean) {
        let modal = document.getElementById('dynamicModal');

        if (!modal) {
            console.error('Dynamic modal container not found');
            return;
        }

        const titleEl = modal.querySelector('.modal-title');
        const bodyEl = modal.querySelector('.modal-body');
        const confirmBtn = modal.querySelector('.btn-primary') as HTMLButtonElement;
        const cancelBtn = modal.querySelector('.btn-secondary') as HTMLButtonElement;

        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.innerHTML = contentHtml;

        // Clear previous event listeners (clone element hack)
        const newConfirmBtn = confirmBtn.cloneNode(true) as HTMLButtonElement;
        confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);

        const newCancelBtn = cancelBtn.cloneNode(true) as HTMLButtonElement;
        cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);

        // Setup events
        newCancelBtn.addEventListener('click', () => this.close('dynamicModal'));

        if (onConfirm) {
            newConfirmBtn.style.display = 'inline-flex';
            newConfirmBtn.addEventListener('click', async () => {
                newConfirmBtn.disabled = true;
                const result = await onConfirm();
                newConfirmBtn.disabled = false;

                if (result !== false) { // Close unless strictly false
                    this.close('dynamicModal');
                }
            });
        } else {
            newConfirmBtn.style.display = 'none';
        }

        this.open('dynamicModal');
    }

    static open(modalId: string) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            const firstInput = modal.querySelector('input') as HTMLElement;
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    static close(modalId: string) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}
