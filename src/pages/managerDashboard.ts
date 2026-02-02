import '../../css/global.css'; // Ensure global styles are loaded
import '../../css/layout/admin-common.css';
import '../../css/pages/manager-dashboard.css';
import '../../css/components/sidebar.css';
import { Navigation } from '../components/Navigation';
import { Sidebar } from '../components/Sidebar';
import { MobileSidebar } from '../components/MobileSidebar';
import { ToastContainer } from '../components/ToastContainer';
import { SidebarItem } from '../types/sidebar.types';
import { authStore } from '../stores/authStore';

let navigation: Navigation | null = null;
let toastContainer: ToastContainer | null = null;
let mobileSidebar: MobileSidebar | null = null;

document.addEventListener('DOMContentLoaded', async () => {
    toastContainer = new ToastContainer();
    const session = await authStore.refreshSession();

    const sidebarItems: SidebarItem[] = [

        { text: 'Agenda Geral', icon: 'calendar_month', href: 'agenda.html' },
        { text: 'Financeiro', icon: 'payments', href: 'financial.html' },
        { text: 'Equipe', icon: 'group', href: 'users.html' },
        { text: 'Exames', icon: 'assignment', href: 'exams.html' },
        { text: 'KPIs', icon: 'analytics', href: 'dashboard.html' },
    ];

    const sidebar = new Sidebar({
        brand: {
            name: 'MedClinic',
            icon: 'local_hospital',
            href: '#'
        },
        items: sidebarItems,
        targetId: 'sidebar-container',
        itemClass: 'nav-item',
        userProfile: session ? {
            name: session.name,
            role: session.role // Simple role for now
        } : undefined
    });

    sidebar.render();
    mobileSidebar = new MobileSidebar();
    navigation = new Navigation();
});
