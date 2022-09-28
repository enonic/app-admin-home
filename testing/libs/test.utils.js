/**
 * Created on 21/03/2018.
 */
const appConst = require("./app_const");
const webDriverHelper = require("./WebDriverHelper");
const LoginPage = require('../page_objects/login.page');
const XpTourDialog = require('../page_objects/xp.tour.dialog');
const addContext = require('mochawesome/addContext');
const fs = require('fs');
const path = require('path');
module.exports = {

    async doLoginAndCloseXpTourDialog() {
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
    async doSwitchToNextTab() {
        let tabs = await this.getBrowser().getWindowHandles();
        return await this.getBrowser().switchToWindow(tabs[tabs.length - 1]);
    },
    saveScreenshot: function (name, that) {

        let screenshotsDir = path.join(__dirname, '/../build/mochawesome-report/screenshots/');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        return webDriverHelper.browser.saveScreenshot(screenshotsDir + name + '.png').then(() => {
            if (that) {
                addContext(that, 'screenshots/' + name + '.png');
            }

            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    }
};
