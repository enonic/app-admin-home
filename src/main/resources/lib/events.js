const eventLib = require('/lib/xp/event');
const websocketLib = require('/lib/xp/websocket');

let initialized = false;

exports.init = function init() {
    if (initialized) {
        return;
    }
    initialized = true;

    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: function (event) {
            websocketLib.sendToGroup('application', JSON.stringify(event));
        }
    });
};
