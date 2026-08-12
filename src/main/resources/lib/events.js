const adminLib = require('/lib/xp/admin');
const eventLib = require('/lib/xp/event');

const topics = require('/lib/topics');

const RELEVANT_EVENT_TYPES = ['STARTED', 'STOPPED', 'UNINSTALLED'];

exports.init = function init() {
    // The topic lives for this application incarnation; the hub clears it when the app stops.
    // Subscribers that arrive before this runs are held off with a retryable deny by the hub.
    adminLib.createTopic({
        name: topics.getAdminToolsChangedTopic(),
        allow: ['role:system.admin.login']
    });

    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: function (event) {
            if (RELEVANT_EVENT_TYPES.indexOf(event.data.eventType) === -1) {
                return;
            }
            // Contentless on purpose: subscribers refetch the menu over an authenticated request,
            // so nothing here needs per-user filtering.
            adminLib.sendToTopic(topics.getAdminToolsChangedTopic());
        }
    });
};
