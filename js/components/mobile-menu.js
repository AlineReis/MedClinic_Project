/**
 * Mobile Menu Component
 * Handles hamburger menu functionality for mobile devices
 */

class MobileMenu {
  constructor() {
    this.isOpen = false;
    this.menuOverlay = null;
    this.init();
  }

  init() {
    // Create menu overlay if it doesn't exist
    if (!document.getElementById('mobile-menu-overlay')) {
      this.createMenuOverlay();
    }

    // Bind hamburger button
    const hamburgerBtn = document.getElementById('mobile-menu-btn');
    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', () => this.open());
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  createMenuOverlay() {
    // Detect if we're in the pages directory or root
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const pathPrefix = isInPagesDir ? '' : 'pages/';

    const overlay = document.createElement('div');
    overlay.id = 'mobile-menu-overlay';
    overlay.className = 'mobile-menu-overlay';
    overlay.innerHTML = `
      <div class="mobile-menu-container">
        <div class="mobile-menu-header">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">local_hospital</span>
            <span class="font-bold text-lg">MedClinic</span>
          </div>
          <button id="mobile-menu-close" class="mobile-menu-close" aria-label="Fechar menu">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav class="mobile-menu-nav">
          <a href="${pathPrefix}patient-dashboard.html" class="mobile-menu-link" data-link="inicio">
            <span class="material-symbols-outlined">home</span>
            Início
          </a>
          <a href="${pathPrefix}my-appointments.html" class="mobile-menu-link" data-link="consultas">
            <span class="material-symbols-outlined">event_note</span>
            Consultas
          </a>
          <a href="${pathPrefix}exams.html" class="mobile-menu-link" data-link="exames">
            <span class="material-symbols-outlined">science</span>
            Exames
          </a>
          <a href="${pathPrefix}schedule-appointment.html" class="mobile-menu-link" data-link="agendar">
            <span class="material-symbols-outlined">calendar_add_on</span>
            Agendar Consulta
          </a>
        </nav>
        <div class="mobile-menu-footer">
          <div class="mobile-menu-user">
            <div class="mobile-menu-avatar">
              <span data-user-initials>U</span>
            </div>
            <div class="mobile-menu-user-info">
              <span class="mobile-menu-user-name" data-user-name>Usuário</span>
              <span class="mobile-menu-user-role" data-user-role>Paciente</span>
            </div>
          </div>
          <button data-logout-button class="mobile-menu-logout">
            <span class="material-symbols-outlined">logout</span>
            Sair
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.menuOverlay = overlay;

    // Bind close button
    const closeBtn = overlay.querySelector('#mobile-menu-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close when clicking outside menu container
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Highlight current page
    this.highlightCurrentPage();
  }

  highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.mobile-menu-link');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (currentPath.includes(href.replace('.html', ''))) {
        link.classList.add('active');
      }
    });
  }

  open() {
    this.isOpen = true;
    this.menuOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    this.menuOverlay.classList.remove('open');
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
  window.mobileMenu = new MobileMenu();
});
