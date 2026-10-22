import type {HTMLAttributes, Ref} from 'preact';

const TAG = 'dashboard-widget';

const DATA_SCRIPT_TYPES = ['application/json', 'application/ld+json', 'text/template', 'text/html'];

const MAX_IMPORT_DEPTH = 5;

const cssTexts = new Map<string, Promise<string>>();

const sheets = new Map<string, Promise<CSSStyleSheet>>();

const hoistedFonts = new Set<string>();

const isAbsolute = (value: string): boolean => /^(https?:|data:|\/\/|#)/.test(value);

const resolveUrl = (value: string, baseUrl: string): string => {
    try {
        return new URL(value, baseUrl).href;
    } catch {
        return value;
    }
};

const rewriteCssUrls = (css: string, baseUrl: string): string =>
    css.replace(/url\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi, (match: string, quote: string, value: string) =>
        isAbsolute(value) ? match : `url(${quote}${resolveUrl(value, baseUrl)}${quote})`
    );

const fetchCss = (href: string): Promise<string> => {
    let text = cssTexts.get(href);
    if (text === undefined) {
        text = fetch(href, {credentials: 'same-origin'}).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch the widget stylesheet at ${href} (${response.status})`);
            }
            return response.text();
        });
        cssTexts.set(href, text);
        text.catch(() => cssTexts.delete(href));
    }
    return text;
};

const closingParen = (text: string, open: number): number => {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '(') {
            depth++;
        } else if (text[i] === ')' && --depth === 0) {
            return i;
        }
    }
    return text.length - 1;
};

const wrapImported = (css: string, prelude: string): string => {
    const wrappers: string[] = [];
    let rest = prelude.trim();
    const layer = /^layer(?:\(([^)]*)\))?(?=\s|$)\s*/i.exec(rest);
    if (layer) {
        wrappers.push(`@layer ${layer[1] ?? ''}`.trim());
        rest = rest.slice(layer[0].length);
    }
    if (/^supports\(/i.test(rest)) {
        const end = closingParen(rest, 'supports'.length);
        wrappers.push(`@supports ${rest.slice('supports'.length, end + 1)}`);
        rest = rest.slice(end + 1).trim();
    }
    if (rest) {
        wrappers.push(`@media ${rest}`);
    }
    return wrappers.reduce((inner, wrapper) => `${wrapper} {\n${inner}\n}`, css);
};

// a constructed stylesheet ignores @import, so imported files are inlined before the sheet is built
const expandImports = async (css: string, baseUrl: string, depth: number): Promise<string> => {
    const imports = /@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1\s*\)?([^;]*);/gi;
    const matches = Array.from(css.matchAll(imports));
    if (matches.length === 0 || depth >= MAX_IMPORT_DEPTH) {
        return css;
    }
    const expanded = await Promise.all(matches.map(async match => {
        const href = resolveUrl(match[2], baseUrl);
        try {
            const imported = await fetchCss(href);
            return wrapImported(rewriteCssUrls(await expandImports(imported, href, depth + 1), href), match[3]);
        } catch (e) {
            console.error(e);
            return '';
        }
    }));
    let index = 0;
    return css.replace(imports, () => expanded[index++]);
};

const toSheet = async (css: string, baseUrl: string): Promise<CSSStyleSheet> => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(rewriteCssUrls(await expandImports(css, baseUrl, 0), baseUrl));
    return sheet;
};

const loadSheet = (href: string): Promise<CSSStyleSheet> => {
    let sheet = sheets.get(href);
    if (sheet === undefined) {
        sheet = fetchCss(href).then(css => toSheet(css, href));
        sheets.set(href, sheet);
        sheet.catch(() => sheets.delete(href));
    }
    return sheet;
};

interface LoadedSheet {
    sheet: CSSStyleSheet;
    key: string;
}

const settled = async (loads: {key: string; sheet: Promise<CSSStyleSheet>}[]): Promise<LoadedSheet[]> => {
    const results = await Promise.allSettled(loads.map(load => load.sheet));
    return results.flatMap((result, index) => {
        if (result.status === 'rejected') {
            console.error(result.reason);
            return [];
        }
        return [{sheet: result.value, key: loads[index].key}];
    });
};

// @font-face rules are ignored inside a shadow root, so they are adopted at document level, once per source
const hoistFontFaces = (sheet: CSSStyleSheet, key: string): void => {
    if (hoistedFonts.has(key)) {
        return;
    }
    const rules = Array.from(sheet.cssRules).filter(rule => rule instanceof CSSFontFaceRule).map(rule => rule.cssText);
    if (rules.length === 0) {
        return;
    }
    const fonts = new CSSStyleSheet();
    fonts.replaceSync(rules.join('\n'));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, fonts];
    hoistedFonts.add(key);
};

export class DashboardWidgetElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    async setHtml(html: string, isCurrent: () => boolean = () => true): Promise<void> {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
        const styles = Array.from(doc.querySelectorAll('style'));
        const scripts = Array.from(doc.querySelectorAll('script'))
            .filter(script => !DATA_SCRIPT_TYPES.includes(script.type.toLowerCase()));
        [...links, ...styles, ...scripts].forEach(element => element.remove());
        if (scripts.length > 0) {
            console.warn(`The dashboard does not run widget scripts; ${scripts.length} dropped`, scripts.map(script => script.src || 'inline'));
        }

        const hrefs = links.map(link => resolveUrl(link.getAttribute('href') ?? '', document.baseURI));
        const loaded = await settled([
            ...hrefs.map(href => ({key: href, sheet: loadSheet(href)})),
            ...styles.map(style => {
                const css = style.textContent ?? '';
                return {key: css, sheet: toSheet(css, document.baseURI)};
            }),
        ]);
        if (!isCurrent()) {
            return;
        }

        const root = this.shadowRoot;
        root.replaceChildren();
        root.adoptedStyleSheets = loaded.map(({sheet}) => sheet);
        loaded.forEach(({sheet, key}) => hoistFontFaces(sheet, key));
        Array.from(doc.body.childNodes).forEach(node => root.appendChild(document.importNode(node, true)));
    }
}

if (!customElements.get(TAG)) {
    customElements.define(TAG, DashboardWidgetElement);
}

declare module 'preact' {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'dashboard-widget': HTMLAttributes<DashboardWidgetElement> & {ref?: Ref<DashboardWidgetElement>};
        }
    }
}
