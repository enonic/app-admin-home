export interface MenuTool {
    id: string;
    url: string;
    title: string;
    description?: string;
    icon?: string;
}

export interface MenuLink {
    url: string;
    caption: string;
    iconUrl: string;
}

export interface MenuData {
    installation: string;
    xpVersion: string;
    user: {
        displayName: string;
        initials: string;
    };
    logoutUrl: string;
    tools: MenuTool[];
    links: MenuLink[];
    phrases: {
        openMenu: string;
        closeMenu: string;
        logout: string;
        usefulLinks: string;
    };
    assets: {
        styles: string;
        fonts: string;
        background: string;
    };
    events?: {
        url: string;
        topic: string;
    };
}

export const fetchMenuData = async (menuUrl: string): Promise<MenuData> => {
    const response = await fetch(menuUrl, {credentials: 'same-origin'});
    if (!response.ok) {
        throw new Error(`XpMenu: failed to fetch ${menuUrl} (${response.status})`);
    }
    return response.json() as Promise<MenuData>;
};
