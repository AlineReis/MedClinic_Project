export interface SidebarItem {
    text: string;
    icon: string;
    href: string;
    active?: boolean;
}

export interface UserProfile {
    name: string;
    role: string;
    initials?: string;
    avatarUrl?: string; // For future use
}

export interface SidebarBrand {
    name: string;
    icon: string;
    href?: string;
}

export interface SidebarOptions {
    targetId?: string; // ID of the container element, defaults to 'sidebar-container'
    targetElement?: HTMLElement; // Direct element reference
    brand: SidebarBrand;
    items: SidebarItem[];
    userProfile?: UserProfile;
    logoutUrl?: string; // If not provided, will rely on event listener
    theme?: 'dark' | 'light'; // If we want to support themes explicitly, though CSS usually handles it
    itemClass?: string; // Custom class for nav items
}
