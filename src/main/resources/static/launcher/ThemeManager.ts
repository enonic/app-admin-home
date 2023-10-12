enum ThemeName {
    DARK = 'DARK',
    LIGHT = 'LIGHT'
}

export class ThemeManager {

    static readonly defaultThemeType: ThemeName = ThemeName.DARK;

    private static getDefaultTheme(): string {
        return ThemeName[ThemeManager.defaultThemeType];
    }

    public static getTheme(name: string): string {
        return (name ? ThemeName[name.toUpperCase()] as string : ThemeManager.getDefaultTheme()).toLowerCase();
    }
}
