import {useStore} from '@nanostores/preact';
import {atom, computed, onMount} from 'nanostores';
import {useEffect} from 'preact/hooks';

export type Theme = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'enonic:theme';

const THEME_CHANGE_EVENT = 'enonic:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const storedTheme = (): Theme => {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    } catch {
        return 'system';
    }
};

const systemTheme = (): ResolvedTheme => window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';

const $theme = atom<Theme>(storedTheme());

const $systemTheme = atom<ResolvedTheme>(systemTheme());

export const $resolvedTheme = computed([$theme, $systemTheme], (theme, system) => theme === 'system' ? system : theme);

onMount($theme, () => {
    const reread = (): void => $theme.set(storedTheme());
    const media = window.matchMedia(DARK_QUERY);
    const onMedia = (): void => $systemTheme.set(systemTheme());
    window.addEventListener('storage', reread);
    window.addEventListener(THEME_CHANGE_EVENT, reread);
    media.addEventListener('change', onMedia);
    return () => {
        window.removeEventListener('storage', reread);
        window.removeEventListener(THEME_CHANGE_EVENT, reread);
        media.removeEventListener('change', onMedia);
    };
});

export const useTheme = (): ResolvedTheme => {
    const theme = useStore($resolvedTheme);
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    return theme;
};
