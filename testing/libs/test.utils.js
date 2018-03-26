/**
 * Created on 21/03/2018.
 */
const launcherPanel = require('../page_objects/launcher.panel');
const homePage = require('../page_objects/home.page');
const loginPage = require('../page_objects/login.page');

const appConst = require("./app_const");
const webDriverHelper = require("./WebDriverHelper");

module.exports = {

    doDeleteCookie: function () {
        return webDriverHelper.browser.getCookie().then(result=> {
            console.log(result);
        }).then(()=> {
            return webDriverHelper.browser.deleteCookie();
        }).then(()=> {
            return console.log('cookie is being deleting...');
        }).pause(2000);
    },
    saveScreenshot: function (name) {
        var path = require('path')
        var screenshotsDir = path.join(__dirname, '/../build/screenshots/');
        return webDriverHelper.browser.saveScreenshot(screenshotsDir + name + '.png').then(()=> {
            return console.log('screenshot saved ' + name);
        }).catch(err=> {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    }
};
