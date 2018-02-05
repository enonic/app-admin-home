var admin = require('/lib/xp/admin');

exports.getBaseUrl = function() {
    return admin.getHomeToolUrl();
};

exports.endsWithSlash = function(url) {
    return url.slice(-1) === '/';
};
