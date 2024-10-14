/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');
const configLib = require('/lib/config');

const addCSPHeaderToResponse = (response) => {
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            securityPolicy =
                `default-src \'self\';
connect-src \'self\' raw.githubusercontent.com/enonic/ ws: wss:;
object-src \'none\';
style-src \'self\' \'unsafe-inline\';
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
        appName: app.name,
        configAsJson: JSON.stringify(configLib.getConfig(), null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
        launcherApiUrl: portal.apiUrl({
            application: app.name,
            api: 'launcher',
        }),
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
