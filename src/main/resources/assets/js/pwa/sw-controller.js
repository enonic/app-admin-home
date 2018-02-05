var mustache = require('/lib/xp/mustache');
var view = resolve('sw-template.js');
var helper = require('helper');

exports.get = function() {
    return {
        headers: {
            'Service-Worker-Allowed': helper.getBaseUrl()
        },
        contentType: 'application/javascript',
        body: mustache.render(view, {
            baseUrl: helper.getBaseUrl(),
            appVersion: app.version
        })
    };
};
