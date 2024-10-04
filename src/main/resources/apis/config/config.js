/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');

function handleGet() {
    const adminUrl = admin.getBaseUri();

    return {
        status: 200,
        contentType: 'application/json',
        body: {
            appId: app.name,
            adminUrl: adminUrl,
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
            widgetApiUrl: portal.apiUrl({
                application: 'admin',
                api: 'widget',
            }),
        }
    };
}

exports.get = handleGet;
