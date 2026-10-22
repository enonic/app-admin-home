import type {AdminMenu} from '@enonic/ui-utils/admin-menu';
import {mountMenu, unmountMenu, type MenuOptions} from './mount';

// what `@enonic/ui-utils/admin-menu` types as AdminMenuOptions, plus `theme` for a host that remounts on a theme switch
type MountOptions = Partial<Omit<MenuOptions, 'menuUrl'>>;

declare global {
    interface Window {
        XpMenu?: AdminMenu;
    }
}

const LOADER_SUFFIX = '-loader';

const loaderUrl = new URL(import.meta.url);

const menuUrl: string = (() => {
    const u = new URL(loaderUrl.href);
    u.search = '';
    u.hash = '';
    if (!u.pathname.endsWith(LOADER_SUFFIX)) {
        throw new Error(`XpMenu loader: expected URL to end with '${LOADER_SUFFIX}'`);
    }
    u.pathname = u.pathname.slice(0, -LOADER_SUFFIX.length);
    return u.toString();
})();

const loaderScript: HTMLScriptElement | undefined = Array.from(document.querySelectorAll('script'))
    .find(script => script.src === import.meta.url);

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
    const hideButtonWhenOpen = sp.get('hideButtonWhenOpen');
    if (hideButtonWhenOpen != null) {
        opts.hideButtonWhenOpen = hideButtonWhenOpen === 'true';
    }
    const theme = sp.get('theme');
    if (theme === 'light' || theme === 'dark') {
        opts.theme = theme;
    }
    return opts;
};

const mount = (options: MountOptions = {}): Promise<HTMLElement> =>
    mountMenu({menuUrl, ...readUrlOptions(), ...options});

window.XpMenu = {mount, unmount: unmountMenu};

const autoMount = loaderScript?.dataset.autoMount !== 'false';
if (autoMount) {
    mount().catch(err => console.error('XpMenu loader: mount failed', err));
}
