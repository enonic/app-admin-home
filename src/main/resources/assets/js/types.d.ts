type LauncherConfig = {
    cls: string,
    theme: string,
    container: string
}
type GlobalConfig = {
    appId: string,
    xpVersion: string,
    adminUrl: string,
    launcherUrl: string,
    assetsUri: string,
    docLinkPrefix: string,
    autoOpenLauncher: boolean,
    tourEnabled: boolean,
    i18nUrl: string,
    launcher: LauncherConfig
};

declare const CONFIG: GlobalConfig;
