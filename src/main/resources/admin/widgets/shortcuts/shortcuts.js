const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const assetLib = require('/lib/enonic/asset');
const mustache = require('/lib/mustache');

function handleGet() {
    const iconsPath = 'icons/widgets/';
    const infoIconUrl = assetLib.assetUrl({ path: `${iconsPath}info-with-circle.svg` });
    const devIconUrl = assetLib.assetUrl({ path: `${iconsPath}developer.svg` });
    const forumIconUrl = assetLib.assetUrl({ path: `${iconsPath}discuss.svg` });
    const marketIconUrl = assetLib.assetUrl({ path: `${iconsPath}market.svg` });
    const slackIconUrl = assetLib.assetUrl({ path: `${iconsPath}slack.svg` });

    const locales = admin.getLocales();
    const dashboardIcons = [
        {
            src: infoIconUrl,
            cls: 'widget-shortcuts-xp-about',
            caption: i18n.localize({
                key: 'home.dashboard.widget.shortcuts.about',
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
            src: slackIconUrl,
            cls: '',
            caption: 'Slack',
            link: 'https://slack.enonic.com/'
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
                key: 'home.dashboard.widget.shortcuts.market',
                bundles: ['i18n/phrases'],
                locale: locales
            }),
            link: 'https://market.enonic.com/'
        }
    ];

    const view = resolve('./shortcuts.html');
    const params = {
        dashboardIcons: dashboardIcons,
        configServiceUrl: portal.serviceUrl({service: 'config'}),
        stylesUri: assetLib.assetUrl({
            path: 'styles/widgets/shortcuts.css'
        }),
        jsUri: assetLib.assetUrl({
            path: 'js/widgets/shortcuts.js'
        }),
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

exports.get = handleGet;
