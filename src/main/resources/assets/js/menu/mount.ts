import {h, render} from 'preact';
import {fetchMenuData} from './data';
import {Menu} from './Menu';
import {loadStyleSheet, registerFonts} from './styles';

export type MenuTheme = 'light' | 'dark';

export interface MenuOptions {
    menuUrl: string;
    appName?: string;
    autoOpen?: boolean;
    hideButtonWhenOpen?: boolean;
    theme?: MenuTheme;
}

const HOST_TAG = 'xp-menu';

class XpMenuElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open', delegatesFocus: true});
    }

    connectedCallback(): void {
        this.setAttribute('tabindex', '1');
    }
}

const defineHost = (): void => {
    const existing = customElements.get(HOST_TAG);
    if (existing === XpMenuElement) {
        return;
    }
    if (existing) {
        throw new Error(`XpMenu: <${HOST_TAG}> is already defined by the page`);
    }
    customElements.define(HOST_TAG, XpMenuElement);
};

let current: XpMenuElement | null = null;

export const unmountMenu = (): void => {
    if (!current) {
        return;
    }
    render(null, current.shadowRoot);
    current.remove();
    current = null;
};

export const mountMenu = async (options: MenuOptions): Promise<HTMLElement> => {
    defineHost();
    unmountMenu();

    const host = document.createElement(HOST_TAG) as XpMenuElement;
    current = host;
    document.body.appendChild(host);

    const data = await fetchMenuData(options.menuUrl);
    const sheet = await loadStyleSheet(data.assets.styles);
    if (current !== host) {
        return host;
    }
    registerFonts(data.assets.fonts);
    host.shadowRoot.adoptedStyleSheets = [sheet];
    render(h(Menu, {data, options, root: host.shadowRoot}), host.shadowRoot);
    return host;
};
