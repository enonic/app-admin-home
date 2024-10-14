export class LocalI18nManager {
    private i18nStore: Map<string, string>;

    constructor(phrases: string) {
        this.initI18NStore(phrases);
    }

    private initI18NStore = (phrasesAsJson: string): void => {
        this.i18nStore = new Map<string, string>();

        const phrases: Record<string, string> = JSON.parse(phrasesAsJson) as Record<string, string>;
        for (const key in phrases) {
            if (Object.prototype.hasOwnProperty.call(phrases, key)) {
                this.i18nStore.set(key, phrases[key]);
            }
        }
    };

    public i18n(key: string, ...args: unknown[]): string {
        const message = this.i18nStore.has(key) ? this.i18nStore.get(key) : `#${key}#`;
        return message.replace(/{(\d+)}/g, function (_substring: string, replaceArg: string): string {
            const index = parseInt(replaceArg, 10);
            if (Number.isNaN(index) || index < 0 || index >= args.length) {
                return _substring;
            }
            const replacement = args[index];
            return typeof replacement === 'string' ? replacement : String(replacement);
        }).trim();
    }

}
