const Page = require('./page');
const appConst = require('../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'WidgetPanel')]",
    widgetShortcutsHeader: "//widget[contains(@id,'widget-shortcuts')]//h5[contains(@class,'widget-header')]",
    youtubeWidget: "//div[descendant::widget[contains(@id,'widget-youtube')]]",
    xpTourDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='XP Tour']]",
    aboutDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='About']]",
    developerDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Developer']]",
    discussDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Discuss']]",
    marketDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Market']]",
    slackDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Slack']]",
};

class ShortcutsWidget extends Page {

    get shortcutsHeader() {
        return XPATH.container + XPATH.widgetShortcutsHeader;
    }

    get youtubeWidget() {
        return XPATH.container + XPATH.youtubeWidget;
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

    get slackItem() {
        return XPATH.container + XPATH.slackDivItem;
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
            let screenshot = appConst.generateRandomName('err_xp_tour');
            await this.saveScreenshot(screenshot);
            throw new Error('Shortcuts Widget error during clicking on Xp tour widget item, screenshot:' + screenshot + "  " + err);
        }
    }

    async clickOnAboutButton() {
        try {
            await this.waitForAboutItemDisplayed();
            await this.clickOnElement(this.aboutItem);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_about');
            await this.saveScreenshot(screenshot);
            throw new Error('Shortcuts Widget error during clicking on About widget item, screenshot:' + screenshot + "  " + err);
        }
    }

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_sh_widget');
            await this.saveScreenshot(screenshot);
            throw new Error('Shortcuts Widget is not loaded, screenshot:' + screenshot + '  ' + err);
        }
    }

    waitForDiscussItemDisplayed() {
        return this.waitForElementDisplayed(this.discussItem, appConst.mediumTimeout);
    }

    waitForDeveloperItemDisplayed() {
        return this.waitForElementDisplayed(this.developerItem, appConst.mediumTimeout);
    }

    waitForMarketItemDisplayed() {
        return this.waitForElementDisplayed(this.marketItem, appConst.mediumTimeout);
    }

    waitForSlackItemDisplayed() {
        return this.waitForElementDisplayed(this.slackItem, appConst.mediumTimeout);
    }

    waitForXpTourItemDisplayed() {
        return this.waitForElementDisplayed(this.xpTourItem, appConst.mediumTimeout);
    }

    waitForAboutItemDisplayed() {
        return this.waitForElementDisplayed(this.aboutItem, appConst.mediumTimeout);
    }

    async getWidgetShortcutHeader() {
        try {
            await this.waitForElementDisplayed(this.shortcutsHeader, appConst.mediumTimeout);
            return this.getText(this.shortcutsHeader);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_sh_widget');
            await this.saveScreenshot(screenshot);
            throw new Error('Widget shortcut header: screenshot ' + screenshot + ' ' + err);
        }
    }

}

module.exports = ShortcutsWidget;
