
export interface SidebarItem {
    text: string;
    icon: string;
    href: string;
    active?: boolean;
    children?: SidebarItem[];
}

export interface SidebarBrand {
    name: string;
    icon: string;
    href: string;
}

export interface SidebarUserProfile {
    name: string;
    role: string;
    avatarUrl?: string;
}

export interface SidebarOptions {
    targetId?: string;       // ID of container to render into
    targetElement?: HTMLElement; // Or direct element
    brand: SidebarBrand;
    items: SidebarItem[];
    userProfile: SidebarUserProfile;
    itemClass?: string;      // Class for nav items (e.g. 'nav-item' or 'admin-nav-item')
}
