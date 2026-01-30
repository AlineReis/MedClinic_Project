/**
 * Mobile Sidebar Component
 * Handles sidebar toggle functionality for mobile devices in dashboard pages
 */

class MobileSidebar {
    constructor() {
        this.isOpen = false;
        this.sidebar = null;
        this.overlay = null;
        this.init();
    }

    init() {
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

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => this.close());
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    open() {
        this.isOpen = true;
        this.sidebar.classList.add('sidebar-open');
        this.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    close() {
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileSidebar = new MobileSidebar();
});
