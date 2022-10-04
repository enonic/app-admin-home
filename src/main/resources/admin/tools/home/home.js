const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');

function getMarketUrl() {
    const marketConfigBean = __.newBean('com.enonic.xp.app.main.GetMarketConfigBean');
    return __.toNativeObject(marketConfigBean.getMarketUrl()).replace('/applications', '');
}

const getDashboardIcons = () => {
    const busIconUrl = portal.assetUrl({path: 'icons/bus.svg'});
    const infoIconUrl = portal.assetUrl({path: 'icons/info-with-circle.svg'});
    const devIconUrl = portal.assetUrl({path: 'icons/developer.svg'});
    const forumIconUrl = portal.assetUrl({path: 'icons/discuss.svg'});
    const marketIconUrl = portal.assetUrl({path: 'icons/market.svg'});

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

    return dashboardIcons;
}

const addCSPHeaderToResponse = (response) => {
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            securityPolicy =
                `default-src \'self\';
connect-src \'self\' raw.githubusercontent.com/enonic/ ${getMarketUrl()}/applications ws: wss:;
object-src \'none\';
style-src \'self\' \'unsafe-inline\';
img-src \'self\' ${getMarketUrl()}`;
        }

        response.headers = {
            'Content-Security-Policy': securityPolicy
        }
    }
}

const generateParams = () => {
    return {
        assetsUri: portal.assetUrl({path: ''}),
        backgroundUri: portal.assetUrl({
            path: 'images/background.webp'
        }),
        launcherPath: admin.getLauncherPath(),
        dashboardIcons: getDashboardIcons(),
        theme: 'light',
        configServiceUrl: portal.serviceUrl({service: 'config'})
    };
}

exports.get = () => {
    const view = resolve('./home.html');
    const params = generateParams();

    const response = {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };

    addCSPHeaderToResponse(response);

    return response;
};
