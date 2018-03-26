/**
 * Created  on 15.09.2017.
 */
module.exports = Object.freeze({
    //waitforTimeout
    TIMEOUT_3: 3000,
    TIMEOUT_2: 2000,
    TIMEOUT_1: 1000,
    TIMEOUT_SUITE: 180000,
    USER_STORE: 'User Store',
    ROLE: 'Role',
    ROLES: 'Roles',
    GROUP: 'Group',
    USER: 'User',
    USER_GROUP: 'User Group',
    CREATE_NEW_HEADER: 'Create New',
    SUPER_USER: 'Super User',
    USER_WIZARD_PASS_MESSAGE: 'Password can not be empty.',
    USER_WIZARD_EMAIL_MESSAGE: 'Email can not be empty.',
    USER_WIZARD_EMAIL_IS_INVALID: 'Email is invalid.',
    USER_WAS_CREATED_MESSAGE: 'User was created',
    GROUP_WAS_CREATED: 'Group was created',
    STANDARD_ID_PROVIDER: 'Standard ID Provider',

    roles: {
        CM_ADMIN: 'Content Manager Administrator',
        ADMIN_CONSOLE: 'Administration Console Login',
        CM_APP: 'Content Manager App',
        ADMINISTRATOR: 'Administrator',
        USERS_APP: 'Users App',
        AUTHENTICATED: 'Authenticated',
        USERS_ADMINISTRATOR: 'Users Administrator',
        EVERYONE: 'Everyone'
    },
    generateRandomName: function (part) {
        return part + Math.round(Math.random() * 1000000);
    },
    principalExistsMessage: function (displayName) {
        return `Principal [${displayName}] could not be created. A principal with that name already exists`
    },

    groupDeletedMessage: function (displayName) {
        return `Principal "group:system:${displayName}" is deleted`
    },
    roleDeletedMessage: function (displayName) {
        return `Principal "role:${displayName}" is deleted`
    },
    userDeletedMessage: function (displayName) {
        return `Principal "user:system:${displayName}" is deleted`
    },
    storeDeletedMessage: function (displayName) {
        return `User Store "${displayName}" is deleted`
    },

});