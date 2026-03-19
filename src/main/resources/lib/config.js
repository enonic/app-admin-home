/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const assetLib = require('/lib/enonic/asset');

const getConfig = (req) => {
    return {
        appId: app.name,
        adminUrl: admin.getHomeToolUrl(),
        assetsUri: assetLib.assetUrl({
            path: ''
        }),
        backgroundUri: assetLib.assetUrl({
            path: 'images/background.webp'
        }),
        xpVersion: admin.getVersion(),
        menuUrl: admin.extensionUrl({
            application: app.name,
            extension: 'menu',
            params: {
                autoOpen: true,
                appName: app.name,
            },
        }),
        extensionApiUrl: portal.apiUrl({
            api: 'admin:extension'
        }),
        statusApiUrl: portal.apiUrl({
            api: 'admin:status',
        }),
        eventApiUrl: portal.apiUrl({
            api: 'admin:event',
        }),
        phrases: JSON.stringify(i18n.getPhrases(req.locales, ['i18n/phrases', 'i18n/common']), null, 4),
    };
}

exports.getConfig = getConfig;
exports.configScriptId = 'home-tool-config-json';
