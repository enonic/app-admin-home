import type {Request} from '/types/Request.d';
import type {Response} from '/types/Response.d';


import {getLauncherPath} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';
// @ts-expect-error No types yet
import {render} from '/lib/mustache';
// @ts-expect-error Cannot find module '/lib/router' or its corresponding type declarations.ts(2307)
import Router from '/lib/router';
import {immutableGetter, getAdminUrl, getAdminNodeModuleUrl} from '/lib/app-main/urlHelper';
import {
	FILEPATH_MANIFEST_NODE_MODULES,
	GETTER_ROOT,
} from '/constants';


const VIEW = resolve('./home.html');
const TOOL_NAME = 'home';

const router = Router();

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


function get(_request: Request): Response {
    // log.info('request:%s', JSON.stringify(request, null, 4));

    const response = {
        contentType: 'text/html',
        body: render(VIEW, {
            appMainBundleUrl: getAdminUrl({
                path: 'home/main.js'
            }, TOOL_NAME),
            appLauncherBundleUrl: getLauncherPath(),
            // appLauncherBundleUrl: getAdminUrl({
            //     path: 'launcher/main.js'
            // }, TOOL_NAME),
            assetsUri: assetUrl({path: ''}),
            jqueryUrl: getAdminNodeModuleUrl('jquery/dist/jquery.min.js', TOOL_NAME),
            jqueryUiUrl: getAdminNodeModuleUrl('jquery-ui-dist/jquery-ui.min.js', TOOL_NAME),
            legacySlickgridUrl: getAdminNodeModuleUrl('@enonic/legacy-slickgrid/index.js', TOOL_NAME),
            // qUrl: getAdminNodeModuleUrl('q/q.js', TOOL_NAME),
            theme: 'dark',
            configServiceUrl: serviceUrl({service: 'config'})
        })
    };

    addCSPHeaderToResponse(response);

    return response;
};

router.get('/?', (r: Request) => get(r));

// Adding these lines makes XP respond with 404
router.all(`/${GETTER_ROOT}/{path:.+}`, (r: Request) => {
    // log.info('static request:%s', JSON.stringify(r, null, 4));
    return immutableGetter(r);
});


export const all = (r: Request) => router.dispatch(r);
