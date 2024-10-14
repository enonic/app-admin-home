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
        i18nUrl: portal.apiUrl({
            application: app.name,
            api: 'i18n',
        }),
        launcherApiUrl: portal.apiUrl({
            application: app.name,
            api: 'launcher',
        }),
        widgetApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'widget',
        }),
        phrases: JSON.stringify(i18n.getPhrases(admin.getLocales(), ['i18n/phrases']), null, 4),
    };
}

const generateConfigScriptId = () => {
    return Math.random().toString(36).substring(2, 15);
}

exports.getConfig = getConfig;
exports.generateConfigScriptId = generateConfigScriptId;
