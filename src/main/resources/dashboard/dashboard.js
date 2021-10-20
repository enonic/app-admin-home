const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');

function getWebApplications(req) {
    const bean = __.newBean('com.enonic.xp.app.main.rest.resource.welcome.WelcomePageScriptBean');

    const params = __.newBean('com.enonic.xp.app.main.rest.resource.welcome.GetWebAppsParams');
    params.serverName = req.serverName;
    params.scheme = req.scheme;
    params.port = req.serverPort;

    return __.toNativeObject(bean.getWebApps(params));
}

exports.get = function (req) {
    let view = resolve('./dashboard.html');
    let webApplications = getWebApplications(req);

    log.info(JSON.stringify(webApplications));

    let params = {
        xpVersion: admin.getVersion(),
        applications: webApplications.applications
    };
    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
};
