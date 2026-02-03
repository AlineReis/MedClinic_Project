
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";

/**
 * Mobile Menu Component
 * Handles hamburger menu functionality for mobile devices
 */
export class MobileMenu {
  private isOpen: boolean = false;
  private menuOverlay: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
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

    // Subscribe to auth updates to keep menu user info sync'd
    authStore.subscribe(state => {
      this.updateUserInfo(state.session);
    });
  }

  private createMenuOverlay() {
    // Detect if we're in the pages directory or root
    // In our build, pages are usually in /pages/, so existing logic might be needed
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
          <a href="patient-dashboard.html" class="mobile-menu-link" data-link="inicio">
            <span class="material-symbols-outlined">home</span>
            Início
          </a>
          <a href="my-appointments.html" class="mobile-menu-link" data-link="consultas">
            <span class="material-symbols-outlined">event_note</span>
            Consultas
          </a>
          <a href="my-exams.html" class="mobile-menu-link" data-link="exames">
            <span class="material-symbols-outlined">science</span>
            Exames
          </a>
          <a href="schedule-appointment.html" class="mobile-menu-link" data-link="agendar">
            <span class="material-symbols-outlined">calendar_add_on</span>
            Agendar Consulta
          </a>
        </nav>
        <div class="mobile-menu-footer">
          <div class="mobile-menu-user">
            <div class="mobile-menu-avatar">
              <span data-mobile-user-initials>U</span>
            </div>
            <div class="mobile-menu-user-info">
              <span class="mobile-menu-user-name" data-mobile-user-name>Usuário</span>
              <span class="mobile-menu-user-role" data-mobile-user-role>Paciente</span>
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

    // Bind footer logout
    // Bind footer logout
    const logoutBtn = overlay.querySelector('.mobile-menu-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authStore.clearSession();
        window.location.href = 'login.html';
      });
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

  private updateUserInfo(session: any) {
    if(!this.menuOverlay || !session) return;
    const nameEl = this.menuOverlay.querySelector('[data-mobile-user-name]');
    const roleEl = this.menuOverlay.querySelector('[data-mobile-user-role]');
    const initialsEl = this.menuOverlay.querySelector('[data-mobile-user-initials]');

    if(nameEl) nameEl.textContent = session.name;
    if(initialsEl) initialsEl.textContent = this.getInitials(session.name);
    // Role logic...
  }

  private getInitials(name: string) {
      return name ? name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'U';
  }

  private highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.mobile-menu-link');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && currentPath.includes(href.replace('.html', ''))) {
        link.classList.add('active');
      }
    });
  }

  open() {
    this.isOpen = true;
    this.menuOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    this.menuOverlay?.classList.remove('open');
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
