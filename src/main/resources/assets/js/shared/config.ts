export interface DashboardConfig {
    autoOpen: boolean;
    menuLoaderUrl: string;
    extensionApiUrl: string;
    eventsUrl: string;
    eventsTopic: string;
    dashboardIcon: string | null;
    phrases: Record<string, string>;
}

export const readConfig = (doc: Document = document): DashboardConfig => {
    const scriptId = doc.querySelector('script[data-config-script-id]')?.getAttribute('data-config-script-id');
    if (!scriptId) {
        throw new Error('No script carries a data-config-script-id attribute');
    }
    const island = doc.getElementById(scriptId);
    if (!island?.textContent) {
        throw new Error(`Config script #${scriptId} is missing or empty`);
    }
    return JSON.parse(island.textContent) as DashboardConfig;
};
