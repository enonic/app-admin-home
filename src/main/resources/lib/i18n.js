/*global require*/

const i18n = require('/lib/xp/i18n');

const BUNDLES = ['i18n/phrases'];
const DEFAULT_LOCALE = 'en';

// Mirrors XP's Locale.lookup (RFC 4647) used by getPhrases: a tag is truncated (pt-BR -> pt), never widened.
const resolvePhrasesLocale = (locales) => {
    const supported = new Map(i18n.getSupportedLocales(BUNDLES).map((tag) => [tag.toLowerCase(), tag]));
    for (const locale of locales || []) {
        const subtags = locale.toLowerCase().split('-');
        for (let length = subtags.length; length > 0; length--) {
            const match = supported.get(subtags.slice(0, length).join('-'));
            if (match !== undefined) {
                return match;
            }
        }
    }
    return DEFAULT_LOCALE;
};

exports.BUNDLES = BUNDLES;
exports.resolvePhrasesLocale = resolvePhrasesLocale;
