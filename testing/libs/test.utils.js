/**
 * Created on 21/03/2018.
 */
const appConst = require("./app_const");
const webDriverHelper = require("./WebDriverHelper");

module.exports = {

    doDeleteCookie: function () {
        return webDriverHelper.browser.getCookies().then(result => {
            console.log(result);
        }).then(() => {
            return webDriverHelper.browser.deleteCookies();
        }).then(() => {
            return console.log('cookie is being deleted...');
        });
    },
    saveScreenshot: function (name) {
        var path = require('path')
        var screenshotsDir = path.join(__dirname, '/../build/screenshots/');
        return webDriverHelper.browser.saveScreenshot(screenshotsDir + name + '.png').then(() => {
            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    }
};
