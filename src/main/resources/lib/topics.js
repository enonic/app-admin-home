/*global app*/

// Admin events hub topics owned by this application. The local name is what setTopic and
// sendToTopic take; the canonical name is what subscribers use.

exports.ADMIN_TOOLS_CHANGED = 'adminToolsChanged';

let canonicalAdminToolsChanged;

exports.getAdminToolsChangedTopic = () => {
    if (canonicalAdminToolsChanged === undefined) {
        canonicalAdminToolsChanged = `${app.name}:${exports.ADMIN_TOOLS_CHANGED}`;
    }
    return canonicalAdminToolsChanged;
};
