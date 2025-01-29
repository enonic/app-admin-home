/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const assetLib = require('/lib/enonic/asset');

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
            adminUrl: admin.getBaseUri(),
            assetsUri: assetLib.assetUrl({
                path: ''
            }),
            backgroundUri: assetLib.assetUrl({
                path: 'images/background.webp'
            }),
            xpVersion: admin.getVersion(),
            i18nUrl: portal.serviceUrl({service: 'i18n'}),
            statusApiUrl: `${baseUri}/rest/status`,
            eventApiUrl: `${baseUri}/event`,
        }
    };
}

exports.get = handleGet;
