/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const buildtime = require('/lib/buildtime');

const STATIC_BASE_PATH = '/_static';

const getAssetsUri = () => admin.extensionUrl({
    application: app.name,
    extension: 'menu'
}) + `${STATIC_BASE_PATH}/${buildtime.getBuildTime()}`;

const adminToolsBean = __.newBean('com.enonic.xp.app.main.GetAdminToolsScriptBean');

const getDashboardIcon = (locales) => {
    const adminTools = __.toNativeObject(adminToolsBean.execute(locales || []));
    for (let i = 0; i < adminTools.length; i++) {
        const tool = adminTools[i];
        if (tool.key.application === app.name && tool.key.name === 'dashboard') {
            return tool.icon;
        }
    }
    return null;
};

const getConfig = (req) => {
    const openMenu = req.params['openMenu'] !== 'false';

    const menuBaseUrl = admin.extensionUrl({
        application: app.name,
        extension: 'menu'
    });
    const separator = menuBaseUrl.indexOf('?') >= 0 ? '&' : '?';
    const menuUrl = `${menuBaseUrl}${separator}appName=${encodeURIComponent(app.name)}&autoOpen=${openMenu}`;

    return {
        appId: app.name,
        adminUrl: admin.getHomeToolUrl(),
        assetsUri: getAssetsUri(),
        xpVersion: admin.getVersion(),
        menuUrl,
        extensionApiUrl: portal.apiUrl({
            api: 'admin:extension'
        }),
        statusApiUrl: portal.apiUrl({
            api: 'admin:status',
        }),
        dashboardIcon: getDashboardIcon(req.locales),
        phrases: JSON.stringify(i18n.getPhrases(req.locales, ['i18n/phrases', 'i18n/common']), null, 4),
    };
}

exports.getConfig = getConfig;
exports.getAssetsUri = getAssetsUri;
exports.configScriptId = 'home-tool-config-json';
