const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');

exports.get = function() {
    const view = resolve('./home.html');
    const params = {
        assetsUri: portal.assetUrl({path: ''}),
        backgroundUri: portal.assetUrl({
            path: 'images/background.webp'
        }),
        launcherPath: admin.getLauncherPath(),
        theme: 'light',
        configServiceUrl: portal.serviceUrl({service: 'config'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
};
