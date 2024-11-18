/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');

const getConfig = () => {
    return {
        appId: app.name,
        adminUrl: admin.getBaseUri(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        backgroundUri: portal.assetUrl({
            path: 'images/background.jpg'
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
            application: 'admin',
            api: 'widget'
        }),
        statusApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'status',
        }),
        eventApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'event',
        }),
        phrases: JSON.stringify(i18n.getPhrases(admin.getLocales(), ['i18n/phrases']), null, 4),
    };
}

exports.getConfig = getConfig;
exports.configScriptId = 'home-tool-config-json';
