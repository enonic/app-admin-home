/*global app*/

let adminToolsGroup;

exports.getAdminToolsGroup = () => {
    if (adminToolsGroup === undefined) {
        adminToolsGroup = `${app.name}:adminTools`;
    }
    return adminToolsGroup;
};

exports.ADMIN_TOOLS_CHANGED = 'adminToolsChanged';
