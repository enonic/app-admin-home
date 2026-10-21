const sheets = new Map<string, Promise<CSSStyleSheet>>();

export const loadStyleSheet = (url: string): Promise<CSSStyleSheet> => {
    let sheet = sheets.get(url);
    if (sheet === undefined) {
        sheet = fetch(url, {credentials: 'same-origin'})
            .then(response => {
                if (!response.ok) {
                    throw new Error(`XpMenu: failed to fetch ${url} (${response.status})`);
                }
                return response.text();
            })
            .then(css => new CSSStyleSheet().replace(css));
        sheets.set(url, sheet);
        sheet.catch(() => sheets.delete(url));
    }
    return sheet;
};

const FONT_FAMILY = 'Open Sans';

const FONT_FACES = [
    {file: 'opensans-regular', weight: '400'},
    {file: 'opensans-bold', weight: '700'},
];

type FontFaceSetWithAdd = FontFaceSet & {add(font: FontFace): FontFaceSet};

let fontsBase: string | null = null;

export const registerFonts = (baseUrl: string): void => {
    if (fontsBase === baseUrl) {
        return;
    }
    fontsBase = baseUrl;
    for (const {file, weight} of FONT_FACES) {
        const source = `url(${baseUrl}/${file}.woff2) format("woff2"), url(${baseUrl}/${file}.woff) format("woff")`;
        (document.fonts as FontFaceSetWithAdd).add(new FontFace(FONT_FAMILY, source, {weight}));
    }
};
