import type {Response} from '/types/Response.d';


// @ts-expect-error No types yet
import {render} from '/lib/mustache';
import {getLocales} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';
import {localize} from '/lib/xp/i18n';



export function get(): Response {
    const iconsPath = 'icons/';
    const busIconUrl = assetUrl({ path: `${iconsPath}bus.svg` });
    const infoIconUrl = assetUrl({ path: `${iconsPath}info-with-circle.svg` });
    const devIconUrl = assetUrl({ path: `${iconsPath}developer.svg` });
    const forumIconUrl = assetUrl({ path: `${iconsPath}discuss.svg` });
    const marketIconUrl = assetUrl({ path: `${iconsPath}market.svg` });
    const slackIconUrl = assetUrl({ path: `${iconsPath}slack.svg` });

    const locales = getLocales();
    const dashboardIcons = [
        {
            src: infoIconUrl,
            cls: 'widget-shortcuts-xp-about',
            caption: localize({
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
            caption: localize({
                key: 'home.dashboard.widget.shortcuts.market',
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
            caption: localize({
                key: 'home.dashboard.widget.shortcuts.tour',
                bundles: ['i18n/phrases'],
                locale: locales
            }),
            link: '#'
        });
    }

    const view = resolve('./shortcuts.html');
    const params = {
        dashboardIcons: dashboardIcons,
        configServiceUrl: serviceUrl({service: 'config'}),
        stylesUri: assetUrl({
            path: 'styles/widgets/shortcuts.css'
        }),
        jsUri: assetUrl({
            path: 'js/widgets/shortcuts.js'
        }),
    };

    return {
        contentType: 'text/html',
        body: render(view, params)
    };
}
