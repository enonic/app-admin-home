const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');

const XPATH = {
    container: "//div[contains(@class,'widget-placeholder') ]",
    header: "//h5[contains(@class,'widget-header')]",
    xpTourTab: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='XP Tour']]",
    aboutTab: "//div[contains(@class,'shortcuts-item') and child::a[text()='About']]",
    licenseHeader: "//div[contains(@class,'xp-license-info-header')]"
};

class ShortcutsWidget extends Page {

    get header() {
        return XPATH.container + XPATH.licensingButton;
    }

    get xpTourItem() {
        return XPATH.container + XPATH.xpTourTab;
    }

    get aboutTab() {
        return XPATH.container + XPATH.aboutTab;
    }

    async clickOnXpTourItem() {
        try {
            await this.waitForXpTourItemDisplayed();
            await this.clickOnElement(this.xpTourItem);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_xp_tour");
            await this.saveScreenshot(screenshot);
            throw new Error("Shortcuts Widget error during clicking on Xp tour widget item, screenshot:" + screenshot + "  " + err);
        }
    }

    async clickOnAboutItem() {
        try {
            await this.waitForAboutItemDisplayed();
            await this.clickOnElement(this.xpTourItem);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_about");
            await this.saveScreenshot(screenshot);
            throw new Error("Shortcuts Widget error during clicking on About widget item, screenshot:" + screenshot + "  " + err);
        }
    }

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_sh_widget");
            await this.saveScreenshot(screenshot);
            throw new Error("Shortcuts Widget is not loaded, screenshot:" + screenshot + "  " + err);
        }
    }

    waitForXpTourItemDisplayed() {
        return this.waitForElementDisplayed(this.xpTourItem);
    }

    waitForAboutItemDisplayed() {
        return this.waitForElementDisplayed(this.aboutTab);
    }

    getHeader() {
        return this.getText(this.getHeader());
    }
}

module.exports = ShortcutsWidget;
