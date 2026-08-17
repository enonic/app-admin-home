/*global app*/

const adminLib = require('/lib/xp/admin');
const eventLib = require('/lib/xp/event');

const ADMIN_TOOLS_CHANGED = 'adminToolsChanged';

const RELEVANT_EVENT_TYPES = ['STARTED', 'STOPPED', 'UNINSTALLED'];

// what subscribers address; the hub composes it from the owning application
exports.ADMIN_TOOLS_CHANGED_TOPIC = `${app.name}:${ADMIN_TOOLS_CHANGED}`;

exports.init = function init() {
    adminLib.setTopic({
        name: ADMIN_TOOLS_CHANGED,
        allow: ['role:system.admin.login']
    });

    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: function (event) {
            if (RELEVANT_EVENT_TYPES.indexOf(event.data.eventType) === -1) {
                return;
            }
            adminLib.sendToTopic(ADMIN_TOOLS_CHANGED);
        }
    });
};
