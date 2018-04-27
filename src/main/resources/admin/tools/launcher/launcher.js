var auth = require('/lib/xp/auth');
var mustache = require('/lib/xp/mustache');
var portal = require('/lib/xp/portal');
var i18n = require('/lib/xp/i18n');
var admin = require('/lib/xp/admin');

var adminToolsBean = __.newBean('com.enonic.xp.app.main.GetAdminToolsScriptBean');

function getAdminTools() {
    var result = __.toNativeObject(adminToolsBean.execute());
    return result.sort(function(tool1, tool2) {
        return (tool1.displayName > tool2.displayName) ? 1 : -1;
    });
}

function localise(key, locales) {
    return i18n.localize({
        key: key,
        bundles: ['i18n/common'],
        locale: locales
    });
}

exports.get = function () {
    var locales = admin.getLocales();

    var adminTools = getAdminTools();
    for (var i = 0; i < adminTools.length; i++) {
        adminTools[i].appId = adminTools[i].key.application;
        adminTools[i].uri = admin.getToolUrl(adminTools[i].key.application, adminTools[i].key.name);
    }

    var userIconUrl = portal.assetUrl({path: "icons/user.svg"});
    var logoutUrl = portal.logoutUrl({
        redirect: admin.getHomeToolUrl({type: 'absolute'})
    });

    var user = auth.getUser();

    var view = resolve('./launcher.html');
    var params = {
        xpVersion: app.version,
        appId: 'launcher',
        adminTools: adminTools,
        userIconUrl: userIconUrl,
        user: user,
        logoutUrl: logoutUrl,
        homeUrl: admin.getHomeToolUrl(),
        installation: admin.getInstallation() || "Tools",
        homeToolCaption: localise('launcher.tools.home.caption', locales),
        homeToolDescription: localise('launcher.tools.home.description', locales),
        logOutLink: localise('launcher.link.logout', locales),
        assetsUri: portal.assetUrl({
            path: ''
        })
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
};
