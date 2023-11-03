/**
 * Created  on 18.03.2018.
 */
module.exports = Object.freeze({
    //waitForTimeout
    mediumTimeout: 3000,
    longTimeout: 7000,
    shortTimeout: 2000,
    TIMEOUT_1: 1000,
    DELETE_COOKIE_TIMEOUT: 20000,
    INSTALL_APP_TIMEOUT: 60000,
    TIMEOUT_SUITE: 180000,
    STANDARD_ID_PROVIDER: 'Standard ID Provider',

    generateRandomName: function (part) {
        return part + Math.round(Math.random() * 1000000);
    },

});
