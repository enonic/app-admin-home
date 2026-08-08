const eventLib = require('/lib/xp/event');
const websocketLib = require('/lib/xp/websocket');

const protocol = require('/lib/socket-protocol');

const ADMIN_TOOLS_CHANGED_MESSAGE = JSON.stringify({type: protocol.ADMIN_TOOLS_CHANGED});

const RELEVANT_EVENT_TYPES = ['STARTED', 'STOPPED', 'UNINSTALLED'];

exports.init = function init() {
    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: function (event) {
            if (RELEVANT_EVENT_TYPES.indexOf(event.data.eventType) === -1) {
                return;
            }
            websocketLib.sendToGroup(protocol.getAdminToolsGroup(), ADMIN_TOOLS_CHANGED_MESSAGE);
        }
    });
};
