const adminLib = require('/lib/xp/admin');
const eventLib = require('/lib/xp/event');

const topics = require('/lib/topics');

const RELEVANT_EVENT_TYPES = ['STARTED', 'STOPPED', 'UNINSTALLED'];

exports.init = function init() {
    adminLib.createTopic({
        name: topics.ADMIN_TOOLS_CHANGED,
        allow: ['role:system.admin.login']
    });

    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: function (event) {
            if (RELEVANT_EVENT_TYPES.indexOf(event.data.eventType) === -1) {
                return;
            }
            adminLib.sendToTopic(topics.ADMIN_TOOLS_CHANGED);
        }
    });
};
