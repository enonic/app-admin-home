/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');

function getMarketUrl() {
    const marketConfigBean = __.newBean('com.enonic.xp.app.main.GetMarketConfigBean');
    return __.toNativeObject(marketConfigBean.getMarketUrl());
}

function handleGet() {
    return {
        status: 200,
        contentType: 'application/json',
        body: {
            appId: app.name,
            adminUrl: admin.getBaseUri(),
            assetsUri: portal.assetUrl({
                path: ''
            }),
            backgroundUri: portal.assetUrl({
                path: 'images/background.jpg'
            }),
            xpVersion: admin.getVersion(),
            i18nUrl: portal.serviceUrl({service: 'i18n'}),
            tourEnabled: !(app.config['tourDisabled'] === 'true' || false),
            marketUrl: getMarketUrl()
        }
    };
}

exports.get = handleGet;
