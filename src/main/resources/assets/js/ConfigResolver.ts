import {JSONObject} from '@enonic/lib-admin-ui/types';

export const resolveScriptConfig = (configScriptId: string): JSONObject => {
    const appConfigEl: HTMLElement = document.getElementById(configScriptId);
    if (!appConfigEl) {
        throw Error('Could not find config script');
    }
    return JSON.parse(appConfigEl.innerText) as JSONObject;
}
