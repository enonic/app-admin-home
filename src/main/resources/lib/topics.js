/*global app*/

// Admin events hub topics owned by this application. Names are free-form on the hub, so the
// application key prefix is what keeps them collision-free by convention.

let adminToolsChangedTopic;

exports.getAdminToolsChangedTopic = () => {
    if (adminToolsChangedTopic === undefined) {
        adminToolsChangedTopic = `${app.name}.adminToolsChanged`;
    }
    return adminToolsChangedTopic;
};
