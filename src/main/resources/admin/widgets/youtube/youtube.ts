import type {Response} from '/types/Response.d';


// @ts-expect-error No types yet
import {render} from '/lib/mustache';
import {assetUrl} from '/lib/xp/portal';


const VIEW = resolve('./youtube.html');

const VIDEO_URLS =  [
    'https://www.youtube.com/embed/Y3Da08ZxmrQ',
    'https://www.youtube.com/embed/1HZedXamJjw',
    'https://www.youtube.com/embed/1LkbsJeBGfo',
    'https://www.youtube.com/embed/UwOhScBk-GY',
    'https://www.youtube.com/embed/Zz5XATq8o_0',
    'https://www.youtube.com/embed/2sf-nsG2qU8',
    'https://www.youtube.com/embed/8qcc_5qvAF8',
    'https://www.youtube.com/embed/m-NdnxI1Tco',
    'https://www.youtube.com/embed/VeDNJfPulTQ',
    'https://www.youtube.com/embed/2HvNoUJSpps',
    'https://www.youtube.com/embed/L3nuE9VGyTo',
    'https://www.youtube.com/embed/Cz11koCKh-Y',
];


export const get = (): Response => {
    const params = {
        videoUrls: VIDEO_URLS,
        stylesUri: assetUrl({
            path: 'styles/widgets/youtube.css'
        }),
    };

    return {
        contentType: 'text/html',
        body: render(VIEW, params)
    };
};
