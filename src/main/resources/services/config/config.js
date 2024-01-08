/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');

function handleGet() {
    let baseUri = admin.getBaseUri();
    if (baseUri.endsWith('/')) {
        baseUri = baseUri.substring(0, baseUri.length - 1);
    }

    return {
        status: 200,
        contentType: 'application/json',
        body: {
            appId: app.name,
            adminUrl: baseUri,
            assetsUri: portal.assetUrl({
                path: ''
            }),
            backgroundUri: portal.assetUrl({
                path: 'images/background.jpg'
            }),
            xpVersion: admin.getVersion(),
            i18nUrl: portal.serviceUrl({service: 'i18n'})
        }
    };
}

exports.get = handleGet;
