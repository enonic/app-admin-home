export type WidgetSize = 'auto' | 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
    key: string;
    title: string;
    url: string;
    width: WidgetSize;
    height: WidgetSize;
    custom: boolean;
    order: number;
    header: boolean;
}

interface ExtensionDescriptorJson {
    key: string;
    title: string;
    url: string;
    config?: Record<string, unknown>;
}

const SIZES: WidgetSize[] = ['auto', 'small', 'medium', 'large', 'full'];

const toSize = (value: unknown): WidgetSize => {
    const size = String(value).toLowerCase() as WidgetSize;
    return SIZES.includes(size) ? size : 'medium';
};

const toWidget = (json: ExtensionDescriptorJson, baseUrl: string): DashboardWidget => {
    const config = json.config ?? {};
    const order = Number(config.order);
    return {
        key: json.key,
        title: json.title,
        url: `${baseUrl}/${json.url}`,
        width: toSize(config.width),
        height: toSize(config.height),
        custom: String(config.style).toLowerCase() === 'custom',
        order: Number.isNaN(order) ? Number.MAX_VALUE : order,
        header: config.header !== false && config.header !== 'false',
    };
};

export const fetchWidgets = async (extensionApiUrl: string): Promise<DashboardWidget[]> => {
    const baseUrl = extensionApiUrl.replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}?interface=admin.dashboard`, {credentials: 'same-origin'});
    if (!response.ok) {
        throw new Error(`Failed to fetch the dashboard widgets (${response.status})`);
    }
    const json = await response.json() as ExtensionDescriptorJson[];
    return json.map(descriptor => toWidget(descriptor, baseUrl)).sort((a, b) => a.order - b.order);
};

export const fetchWidgetHtml = async (url: string): Promise<string> => {
    const response = await fetch(url, {credentials: 'same-origin'});
    if (!response.ok) {
        throw new Error(`Failed to fetch the widget at ${url} (${response.status})`);
    }
    return response.text();
};
