import type {Request} from '/types/Request.d';
import type {Response} from '/types/Response.d';


import {getLauncherPath} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';
// @ts-expect-error No types yet
import {render} from '/lib/mustache';
// @ts-expect-error Cannot find module '/lib/router' or its corresponding type declarations.ts(2307)
// import Router from '/lib/router';
import {immutableGetter, getAdminUrl} from '/lib/app-main/urlHelper';
import {
	FILEPATH_MANIFEST_NODE_MODULES,
	GETTER_ROOT,
} from '/constants';


const VIEW = resolve('./home.html');
const TOOL_NAME = 'home';

// @ts-expect-error A function with a name starting with an uppercase letter should only be used as a constructor
// const router = Router();

// router.all(`/${GETTER_ROOT}/{path:.+}`, (r: Request) => {
// 	return immutableGetter(r);
// });

function getMarketUrl() {
    const marketConfigBean = __.newBean<{
        getMarketUrl(): string;
    }>('com.enonic.xp.app.main.GetMarketConfigBean');
    return __.toNativeObject(marketConfigBean.getMarketUrl()).replace('/applications', '');
}

const addCSPHeaderToResponse = (response: Response) => {
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            securityPolicy =
                `default-src \'self\';
connect-src \'self\' raw.githubusercontent.com/enonic/ ${getMarketUrl()}/applications ws: wss:;
object-src \'none\';
style-src \'self\' \'unsafe-inline\';
img-src \'self\' data: ${getMarketUrl()};
frame-src \'self'\ https://*.youtube.com`;
        }

        response.headers = {
            'content-security-policy': securityPolicy
        }
    }
}


export function get(request: Request): Response {
    log.info('request:%s', JSON.stringify(request, null, 4));
    const response = {
        contentType: 'text/html',
        body: render(VIEW, {
            appMainBundleUrl: getAdminUrl({
                path: 'home/bundle.js'
            }, TOOL_NAME),
            appLauncherBundleUrl: getAdminUrl({
                path: 'launcher/bundle.js'
            }, TOOL_NAME),
            assetsUri: assetUrl({path: ''}),
            jqueryUrl: getAdminUrl({
                manifestPath: FILEPATH_MANIFEST_NODE_MODULES,
                path: 'jquery/dist/jquery.min.js',
            }, TOOL_NAME),
            jqueryUiUrl: getAdminUrl({
                manifestPath: FILEPATH_MANIFEST_NODE_MODULES,
                path: 'jquery-ui-dist/jquery-ui.min.js',
            }, TOOL_NAME),
            launcherPath: getLauncherPath(),
            theme: 'dark',
            configServiceUrl: serviceUrl({service: 'config'})
        })
    };

    addCSPHeaderToResponse(response);

    return response;
};

// router.get('/?', (_r: Request) => get());

// export const all = (r: Request) => router.dispatch(r);
