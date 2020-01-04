/**
 * Created on 21/03/2018.
 */
const appConst = require("./app_const");
const webDriverHelper = require("./WebDriverHelper");
const LoginPage = require('../page_objects/login.page');
const XpTourDialog = require('../page_objects/xp.tour.dialog');

module.exports = {

    async doLogin() {
        let loginPage = new LoginPage();
        let xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        await loginPage.pause(1000);
        let result = await xpTourDialog.isDisplayed();
        if(result){
            await xpTourDialog.clickOnCancelButtonTop();
        }

        return await loginPage.pause(700);
    },
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
