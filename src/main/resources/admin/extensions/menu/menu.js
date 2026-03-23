/*global app, resolve*/

const auth = require('/lib/xp/auth');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');
const assetLib = require('/lib/enonic/asset');

const adminToolsBean = __.newBean(
    'com.enonic.xp.app.main.GetAdminToolsScriptBean'
);

function localise(key, locales) {
    return i18n.localize({
        key: key,
        bundles: ['i18n/phrases'],
        locale: locales
    });
}

exports.get = function(req) {
    const locales = req.locales;
    const phrases = {
        linkLogout: localise('launcher.link.logout', locales),
        tooltipOpenMenu: localise('launcher.tooltip.openMenu', locales),
        tooltipCloseMenu: localise('launcher.tooltip.closeMenu', locales),
    };

    const config = {
        appName: req.params['appName'],
        autoOpen: req.params['autoOpen'] === 'true' || false,
        menuUrl: req.url,
        backgroundUrl: assetLib.assetUrl({ path: 'images/background.webp' }),
        phrases,
        theme: req.params['theme'] || ''
    }

    const adminTools = __.toNativeObject(adminToolsBean.execute(locales) );

    for (let i = 0; i < adminTools.length; i++) {
        adminTools[i].appId = adminTools[i].key.application;
        adminTools[i].uri = admin.getToolUrl(
            adminTools[i].key.application,
            adminTools[i].key.name
        );
        adminTools[i].cls = adminTools[i].appId === config.appName ? 'active' : '';
    }

    const iconsPath = 'icons/extensions/';
    const usefulLinks = [
        {
            iconUrl: assetLib.assetUrl({ path: iconsPath + 'developer.svg' }),
            caption: localise('menu.info.link.developer', locales),
            link: 'https://developer.enonic.com/'
        },
        {
            iconUrl: assetLib.assetUrl({ path: iconsPath + 'slack.svg' }),
            caption: localise('menu.info.link.slack', locales),
            link: 'https://slack.enonic.com/'
        },
        {
            iconUrl: assetLib.assetUrl({ path: iconsPath + 'discuss.svg' }),
            caption: localise('menu.info.link.forum', locales),
            link: 'https://discuss.enonic.com/'
        },
        {
            iconUrl: assetLib.assetUrl({ path: iconsPath + 'market.svg' }),
            caption: localise('menu.info.link.market', locales),
            link: 'https://market.enonic.com/'
        }
    ];

    const logoutUrl = portal.logoutUrl({
        redirect: admin.getHomeToolUrl({ type: 'absolute' })
    });

    const user = auth.getUser();
    const userInitials = (user.displayName || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(function(word) { return word.charAt(0).toUpperCase(); })
        .join('')
        .substring(0, 2);

    const view = resolve('./menu.html');
    const params = {
        adminTools: adminTools,
        user: user,
        userInitials: userInitials,
        logoutUrl: logoutUrl,
        homeTool: {
            url: admin.getHomeToolUrl(),
            caption: localise('home.dashboard', locales),
            description: localise(
                'launcher.tools.home.description',
                locales
            ),
            linkCls: app.name === config.appName ? ' non-interactive' : '',
            rowCls: app.name === config.appName ? ' active' : '',
        },
        xpVersion: admin.getVersion(),
        usefulLinksTitle: localise('menu.info.usefulLinks', locales),
        usefulLinks: usefulLinks,
        installation: admin.getInstallation() || 'Tools',
        stylesUrl: assetLib.assetUrl({
            path: 'styles/menu.css'
        }),
        jsUrl: assetLib.assetUrl({
            path: 'js/menu/bundle.js'
        }),
        phrases,
        configAsJson: JSON.stringify(config, null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
};
