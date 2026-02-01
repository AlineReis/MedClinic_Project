
/**
 * Mobile Sidebar Component
 * Handles sidebar toggle functionality for mobile devices in dashboard pages
 */
export class MobileSidebar {
    private isOpen: boolean = false;
    private sidebar: HTMLElement | null = null;
    private overlay: HTMLElement | null = null;

    constructor() {
        this.init();
    }

    private init() {
        this.sidebar = document.querySelector('aside');
        if (!this.sidebar) return;

        // Create overlay
        this.createOverlay();

        // Bind toggle button
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    private createOverlay() {
        // Check if exists
        if (document.getElementById('sidebar-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => this.close());
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    open() {
        if (!this.sidebar || !this.overlay) return;
        this.isOpen = true;
        this.sidebar.classList.add('sidebar-open');
        this.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.sidebar || !this.overlay) return;
        this.isOpen = false;
        this.sidebar.classList.remove('sidebar-open');
        this.overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}
