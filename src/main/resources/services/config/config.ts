import type {Response} from '/types/Response.d';


import {getBaseUri, getVersion} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';


function getMarketUrl() {
    const marketConfigBean = __.newBean<{
        getMarketUrl(): string;
    }>('com.enonic.xp.app.main.GetMarketConfigBean');
    return __.toNativeObject(marketConfigBean.getMarketUrl());
}

export function get(): Response {
    return {
        status: 200,
        contentType: 'application/json',
        body: {
            appId: app.name,
            adminUrl: getBaseUri(),
            assetsUri: assetUrl({
                path: ''
            }),
            backgroundUri: assetUrl({
                path: 'images/background.jpg'
            }),
            xpVersion: getVersion(),
            i18nUrl: serviceUrl({service: 'i18n'}),
            tourEnabled: !(app.config['tourDisabled'] === 'true' || false),
            marketUrl: getMarketUrl()
        }
    };
}
