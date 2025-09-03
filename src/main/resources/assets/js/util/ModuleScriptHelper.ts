export function getModuleScript(moduleName: string): HTMLScriptElement {
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"]'));
    const script = scripts.find(script => script.src && script.src.includes(moduleName));

    if (!script) {
        throw Error(`Could not find module script for module: ${moduleName}`);
    }

    return script;
}

export function getRequiredAttribute(script: HTMLScriptElement, attributeName: string): string {
    const value = script.getAttribute(attributeName);
    if (!value) {
        throw Error(`Missing '${attributeName}' attribute on script`);
    }
    return value;
}
