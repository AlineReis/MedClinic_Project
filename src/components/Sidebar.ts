import { SidebarOptions, SidebarItem } from "../types/sidebar.types";
import { authStore } from "../stores/authStore";

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
        // Ensure consistent styling class
        this.container.classList.add('sidebar-container');
    }

    public render(): void {
        this.container.innerHTML = `
            ${this.renderHeader()}
            ${this.renderNav()}
            ${this.renderFooter()}
        `;

        this.attachEvents();
    }

    private renderHeader(): string {
        const { brand } = this.options;
        return `
            <div class="sidebar-header">
                <a href="${brand.href}" class="${this.getBrandClass()}">
                    <div class="brand-icon-box">
                        <span class="material-symbols-outlined">${brand.icon}</span>
                    </div>
                    <span class="brand-name">${brand.name}</span>
                </a>
            </div>
        `;
    }

    private getBrandClass(): string {
        return 'sidebar-brand';
    }

    private renderNav(): string {
        const currentPath = window.location.pathname;
        const itemsHtml = this.options.items.map(item => {
            // Simple active check: if href matches current filename
            const isActive = currentPath.includes(item.href);
            const activeClass = isActive ? 'active' : '';
            const baseClass = this.options.itemClass || 'nav-item';

            return `
                <a class="${baseClass} ${activeClass}" href="${item.href}">
                    <span class="material-symbols-outlined">${item.icon}</span>
                    ${item.text}
                </a>
            `;
        }).join('');

        return `
            <nav class="sidebar-nav">
                ${itemsHtml}
            </nav>
        `;
    }

    private renderFooter(): string {
        const { userProfile } = this.options;
        // User initials
        const initials = userProfile.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return `
            <div class="sidebar-footer">
                <div class="user-profile-preview">
                    <div class="user-avatar-sm">${initials}</div>
                    <div class="user-info-text">
                        <span class="user-name-text" title="${userProfile.name}">${userProfile.name}</span>
                        <span class="user-role-text">${this.formatRole(userProfile.role)}</span>
                    </div>
                </div>
                <button id="sidebar-logout-btn" class="logout-btn">
                    <span class="material-symbols-outlined">logout</span>
                    Sair
                </button>
            </div>
        `;
    }

    private formatRole(role: string): string {
        const roles: Record<string, string> = {
            'clinic_admin': 'Admin Clínica',
            'system_admin': 'Super Admin',
            'health_professional': 'Profissional',
            'receptionist': 'Recepção'
        };
        return roles[role] || role;
    }

    private attachEvents(): void {
        const logoutBtn = this.container.querySelector('#sidebar-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authStore.clearSession(); // Use clearSession instead of logout
                window.location.href = 'login.html';
            });
        }
    }
}
