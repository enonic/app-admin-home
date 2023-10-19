import type {Response} from '/types/Response.d';


import {getPhrases} from '/lib/xp/i18n';
import {getLocales} from '/lib/xp/admin';


function localGetPhrases() {
    const locales = getLocales();
    const bundle = getPhrases(locales, ['i18n/common']);
    const phrases = getPhrases(locales, ['i18n/phrases']);

    for (let key in phrases) { bundle[key] = phrases[key] }

    return bundle;
}

export function get(): Response {
    return {
        status: 200,
        contentType: 'application/json',
        body: localGetPhrases()
    }
}


