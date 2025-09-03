/*global app, require*/

const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');
const configLib = require('/lib/config');
const assetLib = require('/lib/enonic/asset');

const addCSPHeaderToResponse = (response) => {
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    if (enableSecurityPolicy) {
        const contentSecurityPolicy = `default-src 'self'; connect-src 'self' raw.githubusercontent.com/enonic/ ws: wss:; font-src data: 'self'; img-src data: 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; frame-src 'self' https://*.youtube.com`;
        const customContentSecurityPolicy = app.config['contentSecurityPolicy.header'];

        response.headers = {
            'Content-Security-Policy': customContentSecurityPolicy || contentSecurityPolicy
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
