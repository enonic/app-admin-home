import {MenuElement} from './MenuElement';
import {Menu, getMenuJsonConfig} from './main';

interface MountOptions {
    appName?: string;
    autoOpen?: boolean;
    theme?: 'light' | 'dark';
}

interface XpMenuApi {
    mount(options?: MountOptions): Promise<HTMLElement>;
    unmount(): void;
}

declare global {
    interface Window {
        XpMenu?: XpMenuApi;
    }
}

const LOADER_SUFFIX = '-loader';

const loaderUrl = new URL(import.meta.url);

const baseMenuUrl: string = (() => {
    const u = new URL(loaderUrl.href);
    u.search = '';
    u.hash = '';
    if (!u.pathname.endsWith(LOADER_SUFFIX)) {
        throw new Error(`XpMenu loader: expected URL to end with '${LOADER_SUFFIX}'`);
    }
    u.pathname = u.pathname.slice(0, -LOADER_SUFFIX.length);
    return u.toString();
})();

const loaderScript: HTMLScriptElement | null = document.querySelector(`script[src="${import.meta.url}"]`);

const readUrlOptions = (): MountOptions => {
    const opts: MountOptions = {};
    const sp = loaderUrl.searchParams;
    const appName = sp.get('appName');
    if (appName) {
        opts.appName = appName;
    }
    const autoOpen = sp.get('autoOpen');
    if (autoOpen != null) {
        opts.autoOpen = autoOpen === 'true';
    }
    const theme = sp.get('theme');
    if (theme === 'light' || theme === 'dark') {
        opts.theme = theme;
    }
    return opts;
};

const buildMenuUrl = (opts: MountOptions): string => {
    const params = new URLSearchParams();
    if (opts.appName) {
        params.set('appName', opts.appName);
    }
    if (opts.autoOpen != null) {
        params.set('autoOpen', String(opts.autoOpen));
    }
    if (opts.theme) {
        params.set('theme', opts.theme);
    }
    const qs = params.toString();
    return qs ? `${baseMenuUrl}?${qs}` : baseMenuUrl;
};

let currentMenuElement: MenuElement | null = null;

const mount = async (options: MountOptions = {}): Promise<HTMLElement> => {
    const opts: MountOptions = {...readUrlOptions(), ...options};

    if (currentMenuElement) {
        currentMenuElement.remove();
        currentMenuElement = null;
    }

    const menuElement = MenuElement.create();
    document.body.appendChild(menuElement);
    currentMenuElement = menuElement;

    const url = buildMenuUrl(opts);
    const response = await fetch(url, {credentials: 'same-origin'});
    if (!response.ok) {
        throw new Error(`XpMenu loader: failed to fetch ${url} — ${response.status}`);
    }
    const html = await response.text();
    await menuElement.setHtml(html);

    const shadowRoot = menuElement.shadowRoot;
    if (shadowRoot) {
        const configEl = shadowRoot.getElementById('menu-config-json');
        if (configEl && !configEl.hasAttribute('data-menu-initialized')) {
            const config = getMenuJsonConfig(shadowRoot);
            new Menu(config, shadowRoot);
        }
    }

    return menuElement;
};

const unmount = (): void => {
    currentMenuElement?.remove();
    currentMenuElement = null;
};

window.XpMenu = {mount, unmount};

const autoMount = loaderScript?.dataset.autoMount !== 'false';
if (autoMount) {
    mount().catch(err => console.error('XpMenu loader: mount failed', err));
}
