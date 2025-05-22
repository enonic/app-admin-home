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
        launcherUrl: admin.widgetUrl({
            application: app.name,
            widget: 'launcher',
            params: {
                autoOpen: true,
                appName: app.name,
            },
        }),
        widgetApiUrl: portal.apiUrl({
            api: 'admin:widget'
        }),
        statusApiUrl: portal.apiUrl({
            api: 'admin:status',
        }),
        eventApiUrl: portal.apiUrl({
            api: 'admin:event',
        }),
        phrases: JSON.stringify(i18n.getPhrases(req.locales, ['i18n/phrases']), null, 4),
    };
}

exports.getConfig = getConfig;
exports.configScriptId = 'home-tool-config-json';
