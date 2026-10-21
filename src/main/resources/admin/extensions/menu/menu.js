/*global app*/

const auth = require('/lib/xp/auth');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');
const staticLib = require('/lib/enonic/static');
const buildtime = require('/lib/buildtime');
const version = require('/lib/version');
const events = require('/lib/events');
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

router.get('', function (req) {
    const locales = req.locales;

    const menuExtensionUrl = admin.extensionUrl({
        application: app.name,
        extension: 'menu'
    });
    const baseAssetUrl = `${menuExtensionUrl}${VERSIONED_BASE_PATH}`;
    const iconsUrl = `${baseAssetUrl}/icons/extensions`;

    const tools = __.toNativeObject(adminToolsBean.execute(locales)).map((tool) => ({
        id: `${tool.key.application}:${tool.key.name}`,
        url: admin.getToolUrl(tool.key.application, tool.key.name),
        title: tool.title,
        description: tool.description,
        icon: tool.icon
    }));

    const links = [
        {
            iconUrl: `${iconsUrl}/developer.svg`,
            caption: localise('menu.info.link.developer', locales),
            url: 'https://developer.enonic.com/'
        },
        {
            iconUrl: `${iconsUrl}/slack.svg`,
            caption: localise('menu.info.link.slack', locales),
            url: 'https://slack.enonic.com/'
        },
        {
            iconUrl: `${iconsUrl}/discuss.svg`,
            caption: localise('menu.info.link.forum', locales),
            url: 'https://discuss.enonic.com/'
        },
        {
            iconUrl: `${iconsUrl}/market.svg`,
            caption: localise('menu.info.link.market', locales),
            url: 'https://market.enonic.com/'
        }
    ];

    const user = auth.getUser();
    const displayName = user.displayName || '';

    return {
        contentType: 'application/json',
        headers: {
            'Cache-Control': 'no-store'
        },
        body: {
            installation: admin.getInstallation() || 'Tools',
            xpVersion: version.getXpVersion(),
            user: {
                displayName: displayName,
                initials: displayName.trim().charAt(0).toUpperCase()
            },
            logoutUrl: portal.logoutUrl({
                redirect: admin.getHomeToolUrl()
            }),
            tools: tools,
            links: links,
            phrases: {
                openMenu: localise('tooltip.openMenu', locales),
                closeMenu: localise('tooltip.closeMenu', locales),
                logout: localise('action.logout', locales),
                usefulLinks: localise('menu.info.usefulLinks', locales)
            },
            assets: {
                styles: `${baseAssetUrl}/styles/menu.css`,
                fonts: `${baseAssetUrl}/fonts`,
                background: `${baseAssetUrl}/images/background.webp`
            },
            events: {
                url: portal.apiUrl({api: 'admin:events'}),
                topic: events.ADMIN_TOOLS_CHANGED_TOPIC
            }
        }
    };
});

router.get(`${STATIC_BASE_PATH}/{path:.*}`, (req) => {
    return staticLib.requestHandler(req, {
        index: false,
        root: '/assets',
        relativePath: staticLib.mappedRelativePath(VERSIONED_BASE_PATH),
        cacheControl: () => staticLib.RESPONSE_CACHE_CONTROL.IMMUTABLE,
    });
});

exports.all = (req) => router.dispatch(req);
