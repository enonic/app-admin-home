import type {Response} from '/types/Response.d';


// @ts-expect-error No types yet
import {render} from '/lib/mustache';
import {getUser} from '/lib/xp/auth';
import {getHomeToolUrl, getInstallation, getLocales, getToolUrl} from '/lib/xp/admin';
import {assetUrl, logoutUrl as getLogoutUrl} from '/lib/xp/portal';
import {localize} from '/lib/xp/i18n';
// @ts-expect-error Cannot find module '/lib/router' or its corresponding type declarations.ts(2307)
// import Router from '/lib/router';
// import {immutableGetter, getAdminUrl} from '/lib/app-main/urlHelper';
// import {
// 	FILEPATH_MANIFEST_NODE_MODULES,
// 	GETTER_ROOT,
// } from '/constants';


const VIEW = resolve('./launcher.html');
// const TOOL_NAME = 'launcher';


const adminToolsBean = __.newBean<{
    execute(): {
        appId: string
        displayName: string
        key: {
            application: string
            name: string
        }
        uri: string
    }[];
}>(
    'com.enonic.xp.app.main.GetAdminToolsScriptBean'
);

function getAdminTools() {
    const result = __.toNativeObject(adminToolsBean.execute());
    return result.sort(function(tool1, tool2) {
        return tool1.displayName > tool2.displayName ? 1 : -1;
    });
}

function localise(key: string, locales: string | string[]) {
    return localize({
        key: key,
        bundles: ['i18n/phrases'],
        locale: locales
    });
}

export function get(): Response {
    const locales = getLocales();

    const adminTools = getAdminTools();
    for (let i = 0; i < adminTools.length; i++) {
        adminTools[i].appId = adminTools[i].key.application;
        adminTools[i].uri = getToolUrl(
            adminTools[i].key.application,
            adminTools[i].key.name
        );
    }

    const userIconUrl = assetUrl({ path: 'icons/user.svg' });
    const logoutUrl = getLogoutUrl({
        redirect: getHomeToolUrl({ type: 'absolute' })
    });

    const user = getUser();

    const params = {
        xpVersion: app.version,
        appId: 'launcher',
        // appLauncherBundleUrl: getAdminUrl({
        //     path: 'launcher/bundle.js'
        // }, TOOL_NAME),
        adminTools: adminTools,
        // jqueryUrl: getAdminUrl({
        //     manifestPath: FILEPATH_MANIFEST_NODE_MODULES,
        //     path: 'jquery/dist/jquery.min.js',
        // }, TOOL_NAME),
        // jqueryUiUrl: getAdminUrl({
        //     manifestPath: FILEPATH_MANIFEST_NODE_MODULES,
        //     path: 'jquery-ui-dist/jquery-ui.min.js',
        // }, TOOL_NAME),
        userIconUrl: userIconUrl,
        user: user,
        logoutUrl: logoutUrl,
        homeTool: {
            url: getHomeToolUrl({ type: 'absolute' }),
            caption: localise('home.dashboard', locales),
            description: localise(
                'launcher.tools.home.description',
                locales
            )
        },
        installation: getInstallation() || 'Tools',
        logOutLink: localise('launcher.link.logout', locales),
        assetsUri: assetUrl({
            path: ''
        })
    };

    return {
        contentType: 'text/html',
        body: render(VIEW, params)
    };
}
