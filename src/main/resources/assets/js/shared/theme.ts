import {readResolvedTheme, subscribeResolvedTheme} from '@enonic/ui-utils';
import {useEffect, useState} from 'preact/hooks';

export type ResolvedTheme = ReturnType<typeof readResolvedTheme>;

export const useTheme = (): ResolvedTheme => {
    const [theme, setTheme] = useState<ResolvedTheme>(() => readResolvedTheme());

    useEffect(() => subscribeResolvedTheme(setTheme), []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    return theme;
};
