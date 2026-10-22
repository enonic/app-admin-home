import {atom} from 'nanostores';

export type Phrases = Readonly<Record<string, string>>;

export const $phrases = atom<Phrases>({});

export const setPhrases = (phrases: Phrases): void => $phrases.set(phrases);

export const i18n = (key: string, ...values: (string | number)[]): string => {
    const phrase = $phrases.get()[key];
    if (phrase === undefined) {
        return `#${key}#`;
    }
    return phrase.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const value = values[Number(index)];
        return value === undefined ? placeholder : String(value);
    });
};
