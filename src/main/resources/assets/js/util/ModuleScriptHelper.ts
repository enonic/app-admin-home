export function getRequiredAttribute(script: HTMLScriptElement, attributeName: string): string {
    const value = script.getAttribute(attributeName);
    if (!value) {
        throw Error(`Missing '${attributeName}' attribute on script`);
    }
    return value;
}
