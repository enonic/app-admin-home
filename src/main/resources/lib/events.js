const eventLib = require('/lib/xp/event');
const websocketLib = require('/lib/xp/websocket');

exports.init = function init() {
    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: function (event) {
            websocketLib.sendToGroup('application', JSON.stringify(event));
        }
    });
};
