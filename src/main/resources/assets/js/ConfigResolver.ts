import type {ConfigObject} from '@enonic/lib-admin-ui/util/Config';

export const resolveScriptConfig = (configScriptId: string): ConfigObject => {
    const appConfigEl: HTMLElement = document.getElementById(configScriptId);
    if (!appConfigEl) {
        throw Error('Could not find config script');
    }
    return JSON.parse(appConfigEl.innerText) as ConfigObject;
}
