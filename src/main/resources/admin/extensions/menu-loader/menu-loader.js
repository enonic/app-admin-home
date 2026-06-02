/*global resolve*/

const staticLib = require('/lib/enonic/static');
const router = require('/lib/router')();

router.get('', (req) => {
    return staticLib.requestHandler(req, {
        index: false,
        root: '/assets/js/menu',
        relativePath: () => '/loader.js',
        cacheControl: () => staticLib.RESPONSE_CACHE_CONTROL.PREVENT,
    });
});

exports.all = (req) => router.dispatch(req);
