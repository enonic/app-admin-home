const PARKED = 'data-inline-style';

const OPENING_TAG = /<[a-zA-Z][^\s/>]*(?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g;

const STYLE_ATTRIBUTE = /(\s)style(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))/gi;

// a `style` attribute written by markup is governed by CSP style-src, and the browser reports it as soon as the markup is
// parsed, in a detached document too. The attributes are renamed in the string and reach the page through CSSOM instead.
export const importHtml = (html: string, target: ParentNode, prepare?: (doc: Document) => void): void => {
    const parked = html.replace(OPENING_TAG, tag => tag.replace(STYLE_ATTRIBUTE, `$1${PARKED}$2`));
    const doc = new DOMParser().parseFromString(parked, 'text/html');
    prepare?.(doc);
    Array.from(doc.body.childNodes).forEach(node => target.appendChild(document.importNode(node, true)));
    target.querySelectorAll<HTMLElement | SVGElement>(`[${PARKED}]`).forEach(element => {
        element.style.cssText = element.getAttribute(PARKED) ?? '';
        element.removeAttribute(PARKED);
    });
};
