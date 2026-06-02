/*global app, resolve*/

const auth = require('/lib/xp/auth');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');
const staticLib = require('/lib/enonic/static');
const buildtime = require('/lib/buildtime');
const router = require('/lib/router')();

const STATIC_BASE_PATH = '/_static';
const VERSIONED_BASE_PATH = `${STATIC_BASE_PATH}/${buildtime.getBuildTime()}`;

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

router.get('', function(req) {
    const locales = req.locales;
    const phrases = {
        linkLogout: localise('action.logout', locales),
        tooltipOpenMenu: localise('tooltip.openMenu', locales),
        tooltipCloseMenu: localise('tooltip.closeMenu', locales),
    };

    const menuExtensionUrl = admin.extensionUrl({
        application: app.name,
        extension: 'menu'
    });
    const baseAssetUrl = `${menuExtensionUrl}${VERSIONED_BASE_PATH}`;

    const themeParam = req.params['theme'];
    const theme = (themeParam === 'dark' || themeParam === 'light') ? themeParam : null;

    const config = {
        appName: req.params['appName'],
        autoOpen: req.params['autoOpen'] === 'true' || false,
        isHomeApp: app.name === req.params['appName'],
        menuUrl: req.url,
        backgroundUrl: `${baseAssetUrl}/images/background.webp`,
        eventApiUrl: portal.apiUrl({api: 'admin:event'}),
        phrases
    }

    const adminTools = __.toNativeObject(adminToolsBean.execute(locales));

    for (let i = 0; i < adminTools.length; i++) {
        adminTools[i].appId = adminTools[i].key.application;
        adminTools[i].uri = admin.getToolUrl(
            adminTools[i].key.application,
            adminTools[i].key.name
        );
        adminTools[i].cls = adminTools[i].appId === config.appName ? 'active' : '';
    }

    const iconsPath = '/icons/extensions/';
    const usefulLinks = [
        {
            iconUrl: `${baseAssetUrl}${iconsPath}developer.svg`,
            caption: localise('menu.info.link.developer', locales),
            link: 'https://developer.enonic.com/'
        },
        {
            iconUrl: `${baseAssetUrl}${iconsPath}slack.svg`,
            caption: localise('menu.info.link.slack', locales),
            link: 'https://slack.enonic.com/'
        },
        {
            iconUrl: `${baseAssetUrl}${iconsPath}discuss.svg`,
            caption: localise('menu.info.link.forum', locales),
            link: 'https://discuss.enonic.com/'
        },
        {
            iconUrl: `${baseAssetUrl}${iconsPath}market.svg`,
            caption: localise('menu.info.link.market', locales),
            link: 'https://market.enonic.com/'
        }
    ];

    const logoutUrl = portal.logoutUrl({
        redirect: admin.getHomeToolUrl({ type: 'absolute' })
    });

    const user = auth.getUser();
    const userInitials = (user.displayName || '')
        .trim()
        .charAt(0)
        .toUpperCase();

    const view = resolve('./menu.html');
    const params = {
        adminTools: adminTools,
        user: user,
        userInitials: userInitials,
        logoutUrl: logoutUrl,
        xpVersion: admin.getVersion(),
        usefulLinksTitle: localise('menu.info.usefulLinks', locales),
        usefulLinks: usefulLinks,
        installation: admin.getInstallation() || 'Tools',
        stylesUrl: `${baseAssetUrl}/styles/menu.css`,
        jsUrl: `${baseAssetUrl}/js/menu/bundle.js`,
        phrases,
        themeClass: theme ? `theme-${theme}` : '',
        configAsJson: JSON.stringify(config, null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
});

router.get(`${STATIC_BASE_PATH}/{path:.*}`, (req) => {
    return staticLib.requestHandler(req, {
        index: false,
        root: '/assets',
        relativePath: staticLib.mappedRelativePath(VERSIONED_BASE_PATH),
    });
});

exports.all = (req) => router.dispatch(req);
