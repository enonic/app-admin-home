var i18n = require('/lib/xp/i18n');
var admin = require('/lib/xp/admin');
var portal = require('/lib/xp/portal');
var mustache = require('/lib/mustache');

exports.get = function() {
    var busIconUrl = portal.assetUrl({ path: 'icons/bus.svg' });
    var infoIconUrl = portal.assetUrl({ path: 'icons/info-with-circle.svg' });
    var docsIconUrl = portal.assetUrl({ path: 'icons/docs.svg' });
    var forumIconUrl = portal.assetUrl({ path: 'icons/discuss.svg' });
    var marketIconUrl = portal.assetUrl({ path: 'icons/market.svg' });

    var docLinkPrefix = 'http://docs.enonic.com/en/';
    var xpVersion = admin.getVersion();
    var isLatestSnapshot = xpVersion.endsWith('.0.SNAPSHOT');

    if (isLatestSnapshot) {
        docLinkPrefix += 'latest';
    } else {
        var versionParts = xpVersion.split('.');
        docLinkPrefix += versionParts[0] + '.' + versionParts[1];
    }

    var locales = admin.getLocales();
    var dashboardIcons = [
        {
            src: infoIconUrl,
            cls: 'xp-about',
            caption: i18n.localize({
                key: 'home.dashboard.about',
                bundles: ['i18n/phrases'],
                locale: locales
            })
        },
        {
            src: docsIconUrl,
            cls: '',
            caption: 'Docs',
            link: docLinkPrefix + '/'
        },
        {
            src: forumIconUrl,
            cls: '',
            caption: 'Discuss',
            link: 'https://discuss.enonic.com/'
        },
        {
            src: marketIconUrl,
            cls: '',
            caption: i18n.localize({
                key: 'home.dashboard.market',
                bundles: ['i18n/phrases'],
                locale: locales
            }),
            link: 'https://market.enonic.com/'
        }
    ];

    var tourEnabled = !(app.config.tourDisabled === 'true' || false);
    if (tourEnabled) {
        dashboardIcons.splice(0, 0, {
            src: busIconUrl,
            cls: 'xp-tour',
            caption: i18n.localize({
                key: 'home.dashboard.tour',
                bundles: ['i18n/phrases'],
                locale: locales
            })
        });
    }

    var view = resolve('./home.html');
    var params = {
        adminUrl: admin.getBaseUri(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        backgroundUri: portal.assetUrl({
            path: 'images/background.jpg'
        }),
        launcherUrl: admin.getLauncherUrl(),
        launcherPath: admin.getLauncherPath(),
        xpVersion: xpVersion,
        docLinkPrefix: docLinkPrefix,
        tourEnabled: tourEnabled,
        dashboardIcons: dashboardIcons,
        i18nUrl: portal.serviceUrl({service: 'i18n'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
};
