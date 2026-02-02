import { SidebarOptions, SidebarItem, UserProfile } from "../types/sidebar.types";

export class Sidebar {
    private options: SidebarOptions;
    private container: HTMLElement;

    constructor(options: SidebarOptions) {
        this.options = options;
        const target = options.targetElement || document.getElementById(options.targetId || 'sidebar-container');

        if (!target) {
            throw new Error((`Sidebar target container not found. ID: ${options.targetId}`));
        }

        this.container = target;
        this.container.classList.add('sidebar-container');
    }

    public render(): void {
        this.container.innerHTML = this.generateHTML();
        this.attachEvents();
    }

    private generateHTML(): string {
        const { brand, items, userProfile } = this.options;

        return `
      <!-- Sidebar Header -->
      <div class="${this.getHeaderClass()}">
        <a href="${brand.href || '#'}" class="${this.getBrandClass()}">
          <div class="brand-icon-box">
            <span class="material-symbols-outlined">${brand.icon}</span>
          </div>
          <span class="brand-name">${brand.name}</span>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="${this.getNavClass()}">
        ${items.map(item => this.generateNavItem(item)).join('')}
      </nav>

      <!-- Footer -->
      <div class="${this.getFooterClass()}">
        ${userProfile ? this.generateUserProfile(userProfile) : ''}
        <button class="logout-btn" data-logout-button>
          <span class="material-symbols-outlined">logout</span> Sair
        </button>
      </div>
    `;
    }

    private generateNavItem(item: SidebarItem): string {
        // Determine classes based on active state or current URL matching
        const isActive = item.active || (window.location.pathname.endsWith(item.href) || window.location.pathname.includes(item.href));
        const activeClass = isActive ? 'active' : '';
        const baseClass = this.options.itemClass || 'sidebar-nav-item';

        return `
      <a class="${baseClass} ${activeClass}" href="${item.href}">
        <span class="material-symbols-outlined">${item.icon}</span> ${item.text}
      </a>
    `;
    }

    private generateUserProfile(user: UserProfile): string {
        const initials = user.initials || user.name.substring(0, 2).toUpperCase();

        return `
      <div class="user-profile-preview">
        <div class="user-avatar-sm">
          <span>${initials}</span>
        </div>
        <div class="user-info-text">
          <span class="user-name-text">${user.name}</span>
          <span class="user-role-text">${user.role}</span>
        </div>
      </div>
    `;
    }

    // Helper methods for classes - can be customized via options later if strict compatibility is needed
    // For now, attempting to use a unified set of classes or relying on the CSS refactor.
    // Given the current state, I'll output standard classes and we might need to update CSS.

    private getHeaderClass(): string {
        return 'sidebar-header';
    }

    private getBrandClass(): string {
        return 'sidebar-brand';
    }

    private getNavClass(): string {
        return 'sidebar-nav';
    }

    private getFooterClass(): string {
        return 'sidebar-footer';
    }

    private attachEvents(): void {
        const logoutBtn = this.container.querySelector('[data-logout-button]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                // Dispatch a custom event that Navigation.ts or other logic can listen to, or handle directly
                // But since Navigation.ts already handles [data-logout-button], we might just rely on that 
                // IF Navigation.ts is initialized AFTER Sidebar renders.
                // We can also dispatch a bubble event.
            });
        }
    }
}
