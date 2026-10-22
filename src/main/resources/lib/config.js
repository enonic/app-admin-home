/*global app, require*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const buildtime = require('/lib/buildtime');
const events = require('/lib/events');

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

const getMenuLoaderUrl = () => admin.extensionUrl({
    application: app.name,
    extension: 'menu-loader'
});

const getConfig = (req) => {
    return {
        autoOpen: req.params['openMenu'] !== 'false',
        menuLoaderUrl: getMenuLoaderUrl(),
        extensionApiUrl: portal.apiUrl({
            api: 'admin:extension'
        }),
        eventsUrl: portal.apiUrl({
            api: 'admin:events',
        }),
        eventsTopic: events.ADMIN_TOOLS_CHANGED_TOPIC,
        dashboardIcon: getDashboardIcon(req.locales),
        phrases: i18n.getPhrases(req.locales, ['i18n/phrases', 'i18n/common']),
    };
}

exports.getConfig = getConfig;
exports.getAssetsUri = getAssetsUri;
exports.getMenuLoaderUrl = getMenuLoaderUrl;
exports.configScriptId = 'home-tool-config-json';
