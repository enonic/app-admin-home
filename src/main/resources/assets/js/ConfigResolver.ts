import {JSONObject} from '@enonic/lib-admin-ui/types';

export const resolveHomeToolConfig = (): JSONObject => {
    const appConfigEl = document.getElementById('home-tool-config-json');
    if (!appConfigEl) {
        throw Error('Could not find tool config');
    }
    return JSON.parse(appConfigEl.innerText) as JSONObject;
}
