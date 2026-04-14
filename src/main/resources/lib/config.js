/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const assetLib = require('/lib/enonic/asset');

const getConfig = (req) => {
    const openMenu = req.params['openMenu'] !== 'false';

    const menuBaseUrl = admin.extensionUrl({
        application: app.name,
        extension: 'menu'
    });
    const separator = menuBaseUrl.indexOf('?') >= 0 ? '&' : '?';
    const menuUrl = `${menuBaseUrl}${separator}appName=${encodeURIComponent(app.name)}&autoOpen=${openMenu}`;

    return {
        appId: app.name,
        adminUrl: admin.getHomeToolUrl(),
        assetsUri: assetLib.assetUrl({
            path: ''
        }),
        xpVersion: admin.getVersion(),
        menuUrl,
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
