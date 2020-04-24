type GlobalConfig = {
    appId: string,
    xpVersion: string,
    adminUrl: string,
    launcherUrl: string,
    assetsUri: string,
    docLinkPrefix: string,
    autoOpenLauncher: boolean,
    tourEnabled: boolean,
    launcherCls: string,
    i18nUrl: string
};

declare const CONFIG: GlobalConfig;
