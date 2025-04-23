/*global app, require*/

const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');
const configLib = require('/lib/config');
const assetLib = require('/lib/enonic/asset');

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

const generateParams = (req) => {
    return {
        assetsUri: assetLib.assetUrl({path: ''}),
        configScriptId: configLib.configScriptId,
        configAsJson: JSON.stringify(configLib.getConfig(req), null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1")
    };
}

exports.get = (req) => {
    const view = resolve('./home.html');
    const params = generateParams(req);

    const response = {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };

    addCSPHeaderToResponse(response);

    return response;
};
