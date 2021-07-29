type LauncherConfig = {
    cls: string,
    theme: string,
    container: string,
}

type GlobalServices = {
    i18nUrl: string,
}

type GlobalConfig = {
    adminUrl: string,
    assetsUri: string,
    launcherUrl: string,
    autoOpenLauncher: boolean,
    appId: string,
    xpVersion: string,
    i18nUrl: string,
    tourEnabled: boolean,
    marketUrl: string,
    launcher?: LauncherConfig;
    services?: GlobalServices;
};

declare const CONFIG: GlobalConfig;
