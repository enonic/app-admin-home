/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');

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
    };
}

exports.getConfig = getConfig;
