/**
 * Created on 21/03/2018.
 */
const appConst = require("./app_const");
const webDriverHelper = require("./WebDriverHelper");
const LoginPage = require('../page_objects/login.page');
const XpTourDialog = require('../page_objects/xp.tour.dialog');
const fs = require('fs');
const path = require('path');
module.exports = {

    getBrowser() {
        if (typeof browser !== 'undefined') {
            return browser;
        } else {
            return webDriverHelper.browser;
        }
    },
    async doLogin(){
        let loginPage = new LoginPage();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        await loginPage.pause(1000);
    },
    async doLoginAndCloseXpTourDialog() {
        let xpTourDialog = new XpTourDialog();
        await this.doLogin();
        await xpTourDialog.waitForDialogLoaded();
        await xpTourDialog.clickOnCancelButtonTop();
    },
    doDeleteCookie() {
        return this.getBrowser().getCookies().then(result => {
            console.log(result);
        }).then(() => {
            return this.getBrowser().deleteCookies();
        }).then(() => {
            return console.log('cookie is being deleting...');
        });
    },
    async doSwitchToNextTab() {
        let tabs = await this.getBrowser().getWindowHandles();
        return await this.getBrowser().switchToWindow(tabs[tabs.length - 1]);
    },
    saveScreenshot(name, that) {
        let screenshotsDir = path.join(__dirname, '/../build/reports/screenshots/');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, {recursive: true});
        }
        return this.getBrowser().saveScreenshot(screenshotsDir + name + '.png').then(() => {
            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    }
};
