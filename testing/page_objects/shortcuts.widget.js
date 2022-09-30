const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');

const XPATH = {
    container: "//div[contains(@class,'widget-placeholder') ]",
    header: "//h5[contains(@class,'widget-header')]",
    xpTourDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='XP Tour']]",
    aboutDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='About']]",
    developerDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Developer']]",
    discussDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Discuss']]",
    marketDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Market']]",
};

class ShortcutsWidget extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get xpTourItem() {
        return XPATH.container + XPATH.xpTourDivItem;
    }

    get aboutItem() {
        return XPATH.container + XPATH.aboutDivItem;
    }

    get developerItem() {
        return XPATH.container + XPATH.developerDivItem;
    }

    get marketItem() {
        return XPATH.container + XPATH.marketDivItem;
    }

    get discussItem() {
        return XPATH.container + XPATH.discussDivItem;
    }

    async clickOnXpTourButton() {
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

    async clickOnAboutButton() {
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

    waitForDiscussItemDisplayed() {
        return this.waitForElementDisplayed(this.discussItem);
    }

    waitForDeveloperItemDisplayed() {
        return this.waitForElementDisplayed(this.developerItem);
    }

    waitForMarketItemDisplayed() {
        return this.waitForElementDisplayed(this.marketItem);
    }

    waitForXpTourItemDisplayed() {
        return this.waitForElementDisplayed(this.xpTourItem);
    }

    waitForAboutItemDisplayed() {
        return this.waitForElementDisplayed(this.aboutItem);
    }

    getHeader() {
        return this.getText(this.header);
    }
}

module.exports = ShortcutsWidget;
