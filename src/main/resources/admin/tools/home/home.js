const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');

exports.get = function() {

    const busIconUrl = portal.assetUrl({ path: 'icons/bus.svg' });
    const infoIconUrl = portal.assetUrl({ path: 'icons/info-with-circle.svg' });
    const devIconUrl = portal.assetUrl({ path: 'icons/developer.svg' });
    const forumIconUrl = portal.assetUrl({ path: 'icons/discuss.svg' });
    const marketIconUrl = portal.assetUrl({ path: 'icons/market.svg' });

    const locales = admin.getLocales();
    const dashboardIcons = [
        {
            src: infoIconUrl,
            cls: 'xp-about',
            caption: i18n.localize({
                key: 'home.dashboard.about',
                bundles: ['i18n/phrases'],
                locale: locales
            }),
            link: '#'
        },
        {
            src: devIconUrl,
            cls: '',
            caption: 'Developer',
            link: 'https://developer.enonic.com/'
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

    const tourEnabled = !(app.config.tourDisabled === 'true' || false);
    if (tourEnabled) {
        dashboardIcons.splice(0, 0, {
            src: busIconUrl,
            cls: 'xp-tour',
            caption: i18n.localize({
                key: 'home.dashboard.tour',
                bundles: ['i18n/phrases'],
                locale: locales
            }),
            link: '#'
        });
    }

    const view = resolve('./home.html');
    const params = {
        assetsUri: portal.assetUrl({path: ''}),
        backgroundUri: portal.assetUrl({
            path: 'images/background.webp'
        }),
        launcherPath: admin.getLauncherPath(),
        dashboardIcons: dashboardIcons,
        theme: 'dark',
        configServiceUrl: portal.serviceUrl({service: 'config'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
};
