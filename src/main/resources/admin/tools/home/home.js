const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');

function getMarketUrl() {
    const marketConfigBean = __.newBean('com.enonic.xp.app.main.GetMarketConfigBean');
    return __.toNativeObject(marketConfigBean.getMarketUrl()).replace('/applications', '');
}

const addCSPHeaderToResponse = (response) => {
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            securityPolicy =
                `default-src \'self\';
connect-src \'self\' raw.githubusercontent.com/enonic/ ${getMarketUrl()}/applications ws: wss:;
object-src \'none\';
style-src \'self\' \'unsafe-inline\';
img-src \'self\' data: ${getMarketUrl()};
frame-src \'self'\ https://*.youtube.com`;
        }

        response.headers = {
            'Content-Security-Policy': securityPolicy
        }
    }
}

const generateParams = () => {
    return {
        assetsUri: portal.assetUrl({path: ''}),
        launcherPath: admin.getLauncherPath(),
        theme: 'dark',
        configServiceUrl: portal.serviceUrl({service: 'config'})
    };
}

exports.get = () => {
    const view = resolve('./home.html');
    const params = generateParams();

    const response = {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };

    addCSPHeaderToResponse(response);

    return response;
};
